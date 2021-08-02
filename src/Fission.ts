export {}
/*
import * as wn from 'webnative';

export class WebnativeConnection {
    state: wn.State | undefined = undefined;

    isConnected(): boolean {
        if (this.state) {
            return this.state.authenticated;
        } else {
            return false;
        }
    }

    isInitialised(): boolean {
        return this.state !== undefined;
    }

    needsAuthentication(): boolean {
        if (this.state) {
            return !this.state.authenticated;
        } else {
            return false;
        }
    }

    presentAuthenticationUI(): void {
        if (this.needsAuthentication() && this.state) {
            wn.redirectToLobby(this.state.permissions);
        }
    }

    async testPrintFiles() {
        if (!this.isConnected() || this.state === undefined) {
            return;
        }
        if (!(this.state.scenario === wn.Scenario.AuthSucceeded ||
            this.state.scenario === wn.Scenario.Continuation)) {
            return;
        }
        const fs = this.state.fs;
        if (fs && fs.appPath) {
            const appPath = fs.appPath() as wn.path.DirectoryPath;
            console.log("appPath", appPath);
            const publicLinksObject = await fs.ls(appPath);
            console.log("links", publicLinksObject);
        }
    }

    async connect() {
        let resultState = await wn.initialise({
            permissions: {
                app: {
                    name: "PodTracer",
                    creator: "Trellick"
                }
            },
            autoRemoveUrlParams: true
        }).catch(err => {
            console.log("Got error", err);
            switch (err) {
              case wn.InitialisationError.InsecureContext:
                // We need a secure context to do cryptography
                // Usually this means we need HTTPS or localhost
                console.log(`Error: need HTTPS/localhost`);
                break;
          
              case wn.InitialisationError.UnsupportedBrowser:
                // Browser not supported.
                // Example: Firefox private mode can't use indexedDB.
                console.log(`Error: Unsupported browser for Fission Webnative`);
                break;
            }
        });
        console.log("Done waiting", resultState);
        if (resultState) {
            this.state = resultState;
            console.log("Connected with state:", resultState);
        }
    }

    async disconnect() {
        await wn.leave({withoutRedirect: true});
        this.state = undefined;
    }
}
*/
