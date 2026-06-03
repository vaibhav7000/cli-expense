#!/usr/bin/env node
import { Command } from "commander";
import { createInterface } from "readline";
import fs from "fs";
import { join } from "path";


import { Expense } from "./class/Expense.js";
import { contentToHTMLFormat } from "./utils/conversion.js";

/**
 * base command: finance
 */
const program = new Command();

/**
 * Creating interface for user interaction from the terminal 
 */
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'finance ',
    terminal: true,
    historySize: 5,
    removeHistoryDuplicates: true,
    crlfDelay: Infinity
})

let didExpensesFileWrittenOnce = false;
let readCurrentExpenseFile = fs.readFileSync(join('finances.json'), 'utf-8');
let curretExpenseState = JSON.parse(readCurrentExpenseFile); // checks to be added later, bydefault considering to be array

program
    .version("1.0.0")
    .description("Welcome to the expense Tracker");


/**
    Sub-Commands
    1. add 
    2. list
    3. summary
    4. delete
    5. export
 */
const subCommands = ['add', 'list', 'summary', 'delete', 'export'];

program
    .command('add')
    .option(`-e, --expense <expensevalue>`, `Value of the expense to be added in finances`, 1000)
    .option(`-t, --title <expensetitle>`, `Title of the expense`, `Travel`)
    .option(`-o, --own [ownspend]`, 'expense for others or own', false)
    .action(async options => {
        const {expense, title, own} = options;

        // need to add checks here for valid number
        const validNumber = Number(expense);
        const answer = await askQuestionWrapper(`Are you ok with the following values to be added in Expense?\n
            1. Expense Value: ${validNumber}\n
            2. Expense Title: ${title}\n
            3. Spent on yourself: ${own}\n
            Type y for <yes> and n for <no>\n`);

            if(answer === 'y') {
                // already maintains the current state using currentExpenseState, maintain this state and write to the file
                console.log("Wait for saving the finance in the logs");
                const currentDate = new Date();
                const newFinance = new Expense(title, validNumber, own, currentDate);
                curretExpenseState.push(newFinance);
                fs.writeFileSync(join('finances.json'), JSON.stringify(curretExpenseState));
                console.log("Finance added");

                didExpensesFileWrittenOnce = true;
                // ask for adding the new expense using the rl.prompt
                const message = await askQuestionWrapper('Do you want to add new Expense? (y/n)\n');

                if(message === 'y') {
                    rl.prompt();
                } else {
                    rl.close();
                }

            } else if(answer === 'n') {
                // manually terminatting the application
                rl.write(null, {
                    ctrl: true,
                    name: 'c'
                })
            } else {
                // do something else
                // which values to change prompt that
            }


    })

program
    .command('list')
    .option('-t, --total <expensestosee>', 'Total Expenses to see', Infinity)
    .option('-o, --order <ordering>', 'Order to show from top to bottom or reverse', 'top')
    .action(options => {
        const { total, order } = options;

        if(!curretExpenseState.length) {
            console.log('Currently the finance log is empty');
            return;
        }
        if(total === Infinity) {
            if(order === 'top') {
                console.log(`${'='.repeat(10)}`)
                
                curretExpenseState.forEach((element, index) => {
                    render(index, element)
                })

                console.log(`${'='.repeat(10)}`)
            } else {
                // bottom to top
                console.log(`${'='.repeat(10)}`)
                for(let index = curretExpenseState.length - 1; index >=0; index--) {
                    render(index, element[index])
                }
                console.log(`${'='.repeat(10)}`)
            }
        } else  {
            if(order === 'top') {
                console.log(`${'='.repeat(10)}`)
                for(let index = 0; index < order; index++) {
                    render(index, element[index])
                }
                console.log(`${'='.repeat(10)}`)
            } else {
                // bottom to top
                console.log(`${'='.repeat(10)}`)
                for(let index = curretExpenseState.length - 1; index >= order; index--) {
                    render(index, element[index]);
                }
                console.log(`${'='.repeat(10)}`)
            }
        }
    })

program
    .command("summary")
    .action(() => {
        let totalCostOfFinances = 0;
        curretExpenseState.forEach(element => {
            totalCostOfFinances+=element.value;
        })
        console.clear();
        console.log(`${'='.repeat(10)}`)
        console.log(`Finances total value: ${totalCostOfFinances}`)
        console.log(`${'='.repeat(10)}`)
    })

/**
 * either delete with date, title (ask to delete to all)
 */
program
    .command("delete")
    .option('-d, --date <YYYY-MM-DD>', "Date that represents expenses to be deleted")
    .option('-t, --title <title', 'Enter Title for expenses to be deleted')
    .option('-a, --all [alltodelete]', 'Either delete all or latest one')
    .action(options => {
        const {date, title, all} = options;
        if(!date && !title && all) {
            // delete all the elements i.e expenses = []
            curretExpenseState = [];
            fs.writeFileSync(join(process.cwd(), 'finances.json'), JSON.stringify(curretExpenseState));
            console.log('successfully deleted')
            return
        }

        const dateToSearch = new Date(date);
        let newResposne;

        if(title && date && all) {
            newResposne = curretExpenseState.filter(element => {
                const expenseDate = new Date(element.date);
                const flag = expenseDate.getDate() === dateToSearch.getDate() && expenseDate.getMonth() === dateToSearch.getMonth() && expenseDate.getFullYear() === dateToSearch.getFullYear();

                if(flag && element.title.toLowerCase() === title.toLowerCase()) {
                    return false;
                }
            })

            curretExpenseState = [...newResposne];
            console.log('successfully deleted')
        } else if(date) {
            if(all) {
                newResposne = curretExpenseState.filter(element => {
                    const expenseDate = new Date(element.date);

                    const flag = expenseDate.getDate() === dateToSearch.getDate() && expenseDate.getMonth() === dateToSearch.getMonth() && expenseDate.getFullYear() === dateToSearch.getFullYear();
                    if(flag) {
                        return false;
                    }
                })
                curretExpenseState = [...newResposne];
                console.log('successfully deleted')
            } else {
                // latest to find i.e present at the bottom
                let finalIndex = -1;

                for(let index = curretExpenseState.length - 1; index >= 0; index--) {
                    const expenseDate = new Date(curretExpenseState[index].date);
                    const flag = expenseDate.getDate() === dateToSearch.getDate() && expenseDate.getMonth() === dateToSearch.getMonth() && expenseDate.getFullYear() === dateToSearch.getFullYear();
                    if(flag) {
                        finalIndex = index
                        break;
                    }
                }

                if(finalIndex >= 0) {
                    curretExpenseState.splice(finalIndex, 1);
                    console.log('successfully deleted')
                } else {
                    console.log(`no element found to be deleted for data ${dateToSearch}`);
                }
            }
        } else if(title) {
            if(all) {
                newResposne = curretExpenseState.filter(element => {
                    if(element.title.toLowerCase() === title.toLowerCase()) {
                        return false;
                    }
                })

                curretExpenseState = [...newResposne];
                console.log('successfully deleted')
            } else {
                // latest to find i.e present at the bottom
                let finalIndex = -1;

                for(let index = curretExpenseState.length - 1; index >= 0; index--) {
                    if(curretExpenseState[index].title.toLowerCase() === title.toLowerCase()) {
                        finalIndex = index
                        break;
                    }
                }

                if(finalIndex >= 0) {
                    curretExpenseState.splice(finalIndex, 1);
                    console.log('successfully deleted')
                } else {
                    console.log(`no element found to be deleted for data ${dateToSearch}`);
                }
            }
            console.log(curretExpenseState)
        }

        didExpensesFileWrittenOnce = true;
    })

program
    .command('export')
    .option('-f, --format <fileformat>', 'Format file to export', 'html')
    .action(options => {
        const { format } = options;

        if(format === 'html') {
            console.log('Saving file on Desktop');
            contentToHTMLFormat(curretExpenseState);
            console.log('Successfully html file on Desktop');
        } else {
            // perform for pdf
        }
    })

rl.on('line', input => {
    // check input contains subCommands
    const command = input.trim().split(' ');
    console.log(command)
    // finance -> base command
    // programtically firing the action of add command
    program.parse(
        [...command],
        {
            from: 'user'
        }
    )
})

rl.on('SIGINT', () => {
    // save the response in finances.json
    if(didExpensesFileWrittenOnce) {
        fs.writeFileSync(join(process.cwd(), 'finances.json'), JSON.stringify(curretExpenseState));
    }
    console.log('Closing the application');
    rl.close();
})

rl.on('close', () => {
    console.log('Application closed');
    process.exit(1);
})


/**
 * 
 * I am thinking of that to write the file when there is signal to close the application, => maintains performant
 */

/**
 * Helper method below
 */

function askQuestionWrapper(question) {
    return new Promise((resolve, reject) => {
        rl.question(question, data => {
            resolve(data.trim());
        })
    })
}

function render(index, element) {
    const elementSpendDate = new Date(element.date);
    console.log('-')
    console.log(`${index + 1}.`)
    console.log(`Title: ${element.title}`)
    console.log(`Title: ${element.value}`)
    console.log(`Spend on yourself: ${element.isOwn ? 'Yes' : 'No'}`)
    console.log(`Date: ${elementSpendDate.getDate()}-${elementSpendDate.getMonth() + 1}-${elementSpendDate.getFullYear()}`)
    console.log('-')
}

program.parse(process.argv);