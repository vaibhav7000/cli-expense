import { WebSocket } from "ws";
import fs from "fs";
import { spawn } from "child_process";

async function htmlToPdf(html, outputPath) {
    // Launch Chrome
    const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
        "--headless",
        "--remote-debugging-port=9222",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get browser websocket endpoint
    const versionRes = await fetch("http://localhost:9222/json/version");

    const { webSocketDebuggerUrl } = await versionRes.json();

    console.log(webSocketDebuggerUrl);
    const browserWs = new WebSocket(webSocketDebuggerUrl);


    browserWs.on('error', (error) => {
        console.log('error')
    });


    let nextId = 1;

    const send = (ws, method, params = {}, sessionId) => {

        return new Promise((resolve, reject) => {
            const id = nextId; // saves previous id
            nextId++;

            const payload = {
                id,
                method,
                params,
            };

            if (sessionId) {
                payload.sessionId = sessionId;
            }

            const handler = data => {
                const msg = JSON.parse(data);

                if (msg.id === id) {
                    
                    ws.off("message", handler);
                    resolve(msg.result);
                }
            };

            ws.on("message", data => {
                handler(data);
            });

            // sends to browser web-socket
            ws.send(JSON.stringify(payload));
        });
    };

    await new Promise(resolve => {
        browserWs.once("open", resolve)
    });

    // Now exposing chrome functionality through the 9222 port, with web-sockets and flowing data with CDP

    // CDP ( chrome dev tool protocol )
    // Target.createTarget -> creates new tab
    // targetId is unique number represent the tab open 
    const { targetId } = await send(browserWs, "Target.createTarget", {
        url: "about:blank"
    });

    // using sessionId, we can control the tab with targetId its created and use the tab according to you problem
    const { sessionId } = await send(browserWs, "Target.attachToTarget",{
            targetId,
            flatten: true,
        });

    // above command create tab and provide sessionId to control the tab, inside Tab we will perform something to generate pdf

    // Enable domains
    // "Page.enable", "Runtime.enable" -> Page level API
    await send(
        browserWs,
        "Page.enable", // Turn on Page API
        {},
        sessionId
    );

    await send(
        browserWs,
        "Runtime.enable", // Turn on JavaScript Runtime API
        {},
        sessionId
    );

    // Turn on Page API, Turn on JavaScript Runtime API

    // Inject HTML
    const encodedHtml =
        Buffer.from(html).toString("base64");


    console.log(encodedHtml);

    await send(
        browserWs,
        "Runtime.evaluate", // command to execute js
        {
            expression: `
        document.open();
        document.write(
          atob('${encodedHtml}')
        );
        document.close();
      `,
        },
        sessionId
    );

    // Give browser time to layout/render
    await new Promise(resolve =>
        setTimeout(resolve, 1000)
    );

    // Generate PDF
    const pdfResult = await send(
        browserWs,
        "Page.printToPDF",
        {
            printBackground: true,
            paperWidth: 8.27,
            paperHeight: 11.69,
        },
        sessionId
    );

    // Save PDF
    fs.writeFileSync(
        outputPath,
        Buffer.from(pdfResult.data, "base64")
    );

    browserWs.close();
    chrome.kill();

    console.log(`PDF saved to ${outputPath}`);
}
