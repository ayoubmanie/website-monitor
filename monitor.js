require('dotenv').config(); // Load .env file
const https = require('https');
const http = require('http');
const nodemailer = require('nodemailer');
const { checkWebsiteContent } = require('./lib/checkWebsiteContent.js');
const config = require('./config.json');

async function checkAllWebsites() {
    const results = [];
    const startTime = Date.now();

    // Check each website and its pages
    for (const website of config.websites) {
        const websiteResults = {
            url: website.websiteUrl,
            pages: [],
            isUp: true,
            errors: []
        };

        for (const page of website.pages) {
            const fullUrl = `${website.websiteUrl}${page.url}`;
            const pageStartTime = Date.now();
            
            try {
                const result = await checkWebsiteContent(fullUrl, page.expectedContent);
                const responseTime = Date.now() - pageStartTime;

                websiteResults.pages.push({
                    url: fullUrl,
                    status: result.success ? 'UP' : 'DOWN',
                    statusCode: result.statusCode || null,
                    responseTime,
                    expectedContent: page.expectedContent,
                    error: result.error || null,
                    contentCheck: result.success ? 'PASSED' : 'FAILED'
                });

                if (!result.success) {
                    websiteResults.isUp = false;
                    websiteResults.errors.push(`Page ${fullUrl}: ${result.error}`);
                }
            } catch (error) {
                websiteResults.pages.push({
                    url: fullUrl,
                    status: 'DOWN',
                    error: error.message,
                    contentCheck: 'FAILED'
                });
                websiteResults.isUp = false;
                websiteResults.errors.push(`Page ${fullUrl}: ${error.message}`);
            }
        }

        results.push(websiteResults);
    }

    const totalTime = Date.now() - startTime;
    await sendReport(results, totalTime);
}

async function sendReport(results, totalTime) {
    const transporter = nodemailer.createTransport({
        service: config.smtp.service,
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // Generate report text
    let reportText = `Website Monitoring Report\n`;
    reportText += `Completed in ${totalTime}ms\n`;
    reportText += `Checked at: ${new Date().toISOString()}\n\n`;

    let allSystemsOk = true;
    let subject = 'All websites are UP';

    for (const website of results) {
        reportText += `Website: ${website.url}\n`;
        reportText += `Overall Status: ${website.isUp ? 'UP' : 'DOWN'}\n`;

        if (!website.isUp) {
            allSystemsOk = false;
            subject = 'Website Monitoring Alert';
        }

        for (const page of website.pages) {
            reportText += `  Page: ${page.url}\n`;
            reportText += `  Status: ${page.status}\n`;
            if (page.statusCode) reportText += `  Status Code: ${page.statusCode}\n`;
            if (page.responseTime) reportText += `  Response Time: ${page.responseTime}ms\n`;
            reportText += `  Content Check (${page.expectedContent}): ${page.contentCheck}\n`;
            if (page.error) reportText += `  Error: ${page.error}\n`;
            reportText += '\n';
        }

        if (website.errors.length > 0) {
            reportText += `  Errors:\n`;
            website.errors.forEach(error => reportText += `  - ${error}\n`);
        }

        reportText += '\n';
    }

    if (!allSystemsOk) {
        subject = `Website Monitoring Alert - ${results.filter(w => !w.isUp).length} issues detected`;
    }
    
    console.log("Subject:");
    console.log(subject);
    console.log("ReportText:");
    console.log(reportText);
    console.log("Receiver email:", config.email.to);

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: config.email.to,
        subject: subject,
        text: reportText
    };
    // return
    try {
        await transporter.sendMail(mailOptions);
        console.log('Monitoring report sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

// Run the checks
checkAllWebsites().catch(console.error);