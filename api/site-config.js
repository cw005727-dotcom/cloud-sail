import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'cw005727-dotcom';
const REPO_NAME = 'cloud-sail';
const BRANCH = 'main';
const FILE_PATH = 'data/courses.json';
const API_BASE = 'https://api.github.com/repos';

// 获取课程数据文件路径（与 courses.js 一致）
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
        message: 'chore: 更新网站设置 [admin save]',
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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const filePath = getFilePath();

        if (req.method === 'GET') {
            let data = {};
            if (existsSync(filePath)) {
                try { data = JSON.parse(readFileSync(filePath, 'utf-8')); } catch(e) {}
            }
            return res.status(200).json(data.siteConfig || {});
        }

        if (req.method === 'POST') {
            const newConfig = req.body;
            let data = {};
            if (existsSync(filePath)) {
                try { data = JSON.parse(readFileSync(filePath, 'utf-8')); } catch(e) {}
            }
            data.siteConfig = { ...(data.siteConfig || {}), ...newConfig };
            const jsonContent = JSON.stringify(data, null, 2);

            // 本地写一份（供当前 Lambda 后续读取）
            writeFileSync(filePath, jsonContent);

            // 推送到 GitHub（触发 Vercel 重新部署）
            if (GITHUB_TOKEN) {
                writeToGitHub(jsonContent).catch(err => {
                    console.error('GitHub write error:', err.message);
                });
            }

            return res.status(200).json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('site-config error:', err.message);
        res.status(500).json({ error: err.message });
    }
}
