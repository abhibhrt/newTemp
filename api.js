import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  const { repo_url, github_token } = req.body;

  const temp = `/tmp/repo-${Date.now()}`;
  const gitUrl = repo_url.replace("https://", `https://${github_token}@`);
  execSync(`git clone ${gitUrl} ${temp}`);

  const readmePath = path.join(temp, "README.md");
  const content = fs.readFileSync(readmePath, 'utf8');

  const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(config);
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "user", content: `Rewrite the following README for SEO:\n\n${content}` }
    ]
  });

  const newContent = response.data.choices[0].message.content;
  fs.writeFileSync(readmePath, newContent);

  execSync(`cd ${temp} && git add README.md && git commit -m "SEO update" && git push`);

  res.status(200).json({ status: "SEO Updated Successfully" });
}
