import fs from "fs";
import os from "os";
import path from "path";

export function contentToHTMLFormat(expensesData) {
    htmlFormat(expensesData);
}

function htmlFormat(data) {
    let finalExpenseCardContainer = '';

    data.forEach(element => {
        const resposne = expenseCard(element);
        finalExpenseCardContainer+=resposne;
    })

    const rootHtml = `<html>
        <head>
            <title>Finance Tracker</title>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="expense-card-container">
                        ${
                            finalExpenseCardContainer
                        }
                    </div>
                </div>
            </div>
        </body>
    </html>`


    // create file
    const homeDirectory = os.homedir();
    // currently storing in the root directory of process
    const desktopPath = path.join(process.cwd(), `${new Date()}.html`);
    fs.writeFileSync(desktopPath, rootHtml, 'utf8');
}

function expenseCard(singleExpense) {
    const { title, value, isOwn, date } = singleExpense;

    return `
        <div>
            <h3>${title}</h3>
            <p>${value}</p>
            <p>${isOwn}</p>
        </div>
    `
}


/**
    Get the data, design a template and create html file with that content
 */