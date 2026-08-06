const xlsxReporter = require('./xlsxReporter');
const generateHtmlReport = require('./generateHtmlReport');

xlsxReporter.startRun();
xlsxReporter.recordTest('System', 'Appium Boot', 'failed', 0, 'Fatal crash during setup or WebDriverIO failure');
xlsxReporter.generateReport('./Test_Results/Excel/android-report.xlsx').then(() => {
    // Also create dummy jsonl for HTML
    const fs = require('fs');
    fs.writeFileSync('.wdio-results.jsonl', JSON.stringify({
        category: 'System', title: 'Appium Boot', status: 'failed', duration: 15, error: 'Fatal crash during setup'
    }) + '\n');
    generateHtmlReport('.wdio-results.jsonl', './Test_Results/HTML/execution-report.html');
});
