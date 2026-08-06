const fs = require('fs');
const path = require('path');

module.exports = function generateHtmlReport(jsonlPath, outputPath) {
    if (!fs.existsSync(jsonlPath)) {
        console.error("No results JSONL found.");
        return;
    }

    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
    let tests = [];
    let passed = 0, failed = 0;

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            tests.push(data);
            if (data.status === 'passed') passed++;
            else failed++;
        } catch(e) {}
    });

    const total = passed + failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OUDS Android Appium E2E Report</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4f46e5; }
        h1 { margin: 0 0 10px 0; font-size: 24px; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-card { background: #1e293b; padding: 15px 25px; border-radius: 8px; text-align: center; flex: 1; }
        .stat-value { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
        .pass { color: #10b981; }
        .fail { color: #ef4444; }
        .table-wrap { background: #1e293b; border-radius: 8px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 12px 15px; border-bottom: 1px solid #334155; }
        th { background: #0f172a; font-weight: 600; text-transform: uppercase; font-size: 13px; }
        tr:hover { background: #334155; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge.passed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .badge.failed { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .error-msg { font-family: monospace; font-size: 12px; color: #fca5a5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Android E2E Execution Report</h1>
            <p style="color: #94a3b8; margin: 0;">1,111 Parameterized Mobile Tests</p>
        </div>
        
        <div class="stats">
            <div class="stat-card"><div class="stat-value">${total}</div><div style="color: #94a3b8">Total Executed</div></div>
            <div class="stat-card"><div class="stat-value pass">${passed}</div><div style="color: #94a3b8">Passed</div></div>
            <div class="stat-card"><div class="stat-value fail">${failed}</div><div style="color: #94a3b8">Failed</div></div>
            <div class="stat-card"><div class="stat-value" style="color: ${passRate == 100 ? '#10b981' : '#f59e0b'}">${passRate}%</div><div style="color: #94a3b8">Pass Rate</div></div>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Test Case</th>
                        <th>Status</th>
                        <th>Duration (ms)</th>
                        <th>Error Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${tests.map(t => `
                    <tr>
                        <td>${t.category}</td>
                        <td>${t.title}</td>
                        <td><span class="badge ${t.status}">${t.status.toUpperCase()}</span></td>
                        <td>${t.duration}</td>
                        <td class="error-msg">${t.error || '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(outputPath, html);
    console.log(`HTML report generated at ${outputPath}`);
};
