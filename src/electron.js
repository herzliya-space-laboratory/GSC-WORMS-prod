const { app, BrowserWindow, dialog, remote } = require("electron");
const path = require("path");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let watcher;

function createWindow() {
	const mode = process.env.NODE_ENV;
	mainWindow = new BrowserWindow({
		width: 900,
		height: 680,
		icon: __dirname + "/worms-icon.png",
		title: "WORMS",
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
		},
	});
	mainWindow.maximize();
	mainWindow.setMenuBarVisibility(false);
	mainWindow.loadURL(
		`file://${path.resolve(__dirname, "../public/index.html")}`
	);

	mainWindow.on("close", function (e) {
		const choice = require("electron").dialog.showMessageBoxSync(this, {
			type: "question",
			buttons: ["Yes", "No"],
			title: "Confirm",
			message:
				"Are you sure you want to quit?\nAny unsaved wok wil be lost.",
		});
		if (choice === 1) {
			e.preventDefault();
		}
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	if (process.env.NODE_ENV === "development") {
		watcher = require("chokidar").watch(
			path.join(__dirname, "../public/build"),
			{ ignoreInitial: true }
		);
		watcher.on("change", () => {
			mainWindow.reload();
		});
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
	if (watcher) {
		watcher.close();
	}
});

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});
