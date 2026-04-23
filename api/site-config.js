import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'cw005727-dotcom';
const REPO_NAME = 'cloud-sail';
const BRANCH = 'main';
const FILE_PATH = 'data/courses.json';
const API_BASE = 'https://api.github.com/repos';

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

export default function handler(req, res) {
    const filePath = join(process.cwd(), 'data', 'courses.json');

    if (req.method === 'GET') {
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            res.status(200).json(data.siteConfig || {});
        } catch (e) {
            res.status(500).json({ error: 'Failed to load site config' });
        }
    } else if (req.method === 'POST') {
        try {
            const newConfig = req.body;
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            data.siteConfig = { ...data.siteConfig, ...newConfig };
            const jsonContent = JSON.stringify(data, null, 2);
            writeFileSync(filePath, jsonContent);

            if (GITHUB_TOKEN) {
                writeToGitHub(jsonContent).catch(err => {
                    console.error('GitHub write error:', err.message);
                });
            }

            res.status(200).json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Failed to save site config' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
