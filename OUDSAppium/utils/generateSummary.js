const fs = require('fs');

module.exports = function generateSummary(jsonlPath) {
    if (!fs.existsSync(jsonlPath) || !process.env.GITHUB_STEP_SUMMARY) return;
    
    let passed = 0, failed = 0;
    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
    
    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            if (data.status === 'passed') passed++;
            else failed++;
        } catch(e) {}
    });

    const total = passed + failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
    
    const summary = `## 📱 Android E2E Appium Results
- **Total Tests:** ${total}
- **Passed:** ✅ ${passed}
- **Failed:** ❌ ${failed}
- **Pass Rate:** ${passRate}%

[View Full HTML Report](https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'repo'}/reports/latest/execution-report.html)
`;

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
};
