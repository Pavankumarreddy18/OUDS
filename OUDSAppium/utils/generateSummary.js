const fs = require('fs');
const path = require('path');

module.exports = function generateSummary(jsonlPath) {
    if (!fs.existsSync(jsonlPath) || !process.env.GITHUB_STEP_SUMMARY) return;
    
    let passed = 0, failed = 0;
    let totalDurationMs = 0;
    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
    
    let cats = {};

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            if (data.status === 'passed') passed++;
            else failed++;
            totalDurationMs += (data.duration || 0);

            if (!cats[data.category]) {
                cats[data.category] = { passed: 0, failed: 0 };
            }
            if (data.status === 'passed') cats[data.category].passed++;
            else cats[data.category].failed++;
        } catch(e) {}
    });

    const total = passed + failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
    const durationSec = (totalDurationMs / 1000).toFixed(2);
    
    // Copy excel file to HTML folder for deployment
    try {
        fs.copyFileSync('./Test_Results/Excel/android-report.xlsx', './Test_Results/HTML/android-report.xlsx');
    } catch (e) {
        console.error("Failed to copy excel report for deployment", e);
    }

    const runNumber = process.env.GITHUB_RUN_NUMBER || '1';
    const repoPath = process.env.GITHUB_REPOSITORY || 'repo/name';
    const repoOwner = repoPath.split('/')[0];
    const repoName = repoPath.split('/')[1];

    let summary = `## 📱 Mobile E2E Test Execution Summary (Build #${runNumber})\n\n`;
    
    summary += `| Metric | Value | Status |\n`;
    summary += `|--------|-------|--------|\n`;
    summary += `| Total Tests | ${total} | ℹ️ |\n`;
    summary += `| Passed | ${passed} | ✅ |\n`;
    summary += `| Failed | ${failed} | ${failed > 0 ? '❌' : '➖'} |\n`;
    summary += `| Pass Rate | ${passRate}% | 🏆 |\n`;
    summary += `| Duration | ${durationSec}s | ⏱️ |\n\n`;

    summary += `### 📊 Results by Category\n\n`;
    summary += `| Category | Total | Passed | Failed | Pass Rate |\n`;
    summary += `|----------|-------|--------|--------|-----------|\n`;

    Object.keys(cats).forEach(cat => {
        const catTotal = cats[cat].passed + cats[cat].failed;
        const catRate = catTotal > 0 ? ((cats[cat].passed / catTotal) * 100).toFixed(1) : 0;
        summary += `| ${cat} | ${catTotal} | ${cats[cat].passed} | ${cats[cat].failed} | ${catRate}% |\n`;
    });

    summary += `\n### 🌐 Native GitHub Pages Deployment\n\n`;
    summary += `The Mobile Appium E2E test report bundle has been published directly to GitHub Pages:\n\n`;
    summary += `- 🔗 [Live Latest HTML Execution Report](https://${repoOwner}.github.io/${repoName}/reports/latest/execution-report.html)\n`;
    summary += `- 🔗 [Live Build-Specific Execution Report](https://${repoOwner}.github.io/${repoName}/reports/history/build-${runNumber}/execution-report.html)\n`;
    summary += `- 🔗 [Download Latest Excel Report (.xlsx)](https://${repoOwner}.github.io/${repoName}/reports/latest/android-report.xlsx)\n`;

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
};
