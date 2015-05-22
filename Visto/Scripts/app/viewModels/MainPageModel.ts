import visto = require("libs/visto");
import common = require("common/main");
import package = require("module");

export class MainPageModel extends visto.ViewModel {
	selectedText: KnockoutObservable<string>;

	initialize() {
        this.enablePageRestore();
		this.selectedText = ko.observable("sample");
    }

    navigateToTabPage() {
        visto.navigateTo(package, "TabPage");
    }

	navigateToListPage() {
        visto.navigateTo(package, "ListPage");
	}

    navigateToWebViewPage() {
        visto.navigateTo(package, "WebViewPage");
    }

	showNotImplemented() {
		// sample of translation in code: 
		common.alert("Not implemented", this.getString("notImplementedMessage"));
	}

	showDialog() {
        visto.showDialog(package, "SampleDialog", <visto.IDialogOptions>{
			title: "Sample dialog",
            buttons: [
                { label: "OK", click: (dialog) => { dialog.close(); } }
            ]
        });
	}
};