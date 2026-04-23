import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// GitHub 配置（用于持久化写入）
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'cw005727-dotcom';
const REPO_NAME = 'cloud-sail';
const BRANCH = 'main';
const FILE_PATH = 'data/courses.json';
const API_BASE = 'https://api.github.com/repos';

function getFilePath() {
    return join(process.cwd(), 'data', 'courses.json');
}

// GitHub API 获取当前文件 SHA
async function getFileSHA() {
    const url = `${API_BASE}/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    if (res.status === 404) return null;
    const data = await res.json();
    return data.sha;
}

// 通过 GitHub API 写入文件
async function writeToGitHub(content) {
    const sha = await getFileSHA();
    const url = `${API_BASE}/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const body = {
        message: 'chore: 更新课程数据 [admin save]',
        content: Buffer.from(content).toString('base64'),
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify(body)
    });
    return res.json();
}

export default function handler(req, res) {
    const filePath = getFilePath();

    if (req.method === 'GET') {
        try {
            const data = existsSync(filePath)
                ? JSON.parse(readFileSync(filePath, 'utf-8'))
                : {};
            res.status(200).json(data);
        } catch (e) {
            res.status(500).json({ error: 'Failed to load courses' });
        }
    } else if (req.method === 'PUT') {
        try {
            const jsonContent = JSON.stringify(req.body, null, 2);

            // 本地写一份（供 Vercel 运行时读取）
            writeFileSync(filePath, jsonContent);

            // 如果配置了 GITHUB_TOKEN，异步推送到 GitHub（触发 Vercel 重新部署）
            if (GITHUB_TOKEN) {
                writeToGitHub(jsonContent).then(githubRes => {
                    if (githubRes.content) {
                        console.log('✅ GitHub 文件更新成功，Vercel 将自动重新部署');
                    } else if (githubRes.message) {
                        console.error('❌ GitHub 更新失败:', githubRes.message);
                    }
                }).catch(err => {
                    console.error('❌ GitHub API 错误:', err.message);
                });
            }

            res.status(200).json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Failed to save courses' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
