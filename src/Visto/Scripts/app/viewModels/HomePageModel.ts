import visto = require("libs/visto");
import common = require("common/main");
import pkg = require("module");

export class HomePageModel extends visto.ViewModel {
    initialize() {
        this.enablePageRestore();
    }

    navigateToBindings() {
        visto.navigateTo(pkg, "BindingsPage");
    }

    navigateToForm() {
        visto.navigateTo(pkg, "FormPage");
    }

    navigateToRecursivePage() {
        visto.navigateTo(pkg, "RecursivePage");
    }

    navigateToInternationalization() {
        visto.navigateTo(pkg, "InternationalizationPage");
    }

    navigateToTabPage() {
        visto.navigateTo(pkg, "TabPage");
    }

	navigateToListPage() {
        visto.navigateTo(pkg, "ListPage");
    }

    navigateToWebViewPage() {
        visto.navigateTo(pkg, "WebViewPage");
    }

	showAlert() {
        common.alert(this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
	}

	showCustomDialog() {
        visto.showDialog(pkg, "SampleDialog");
	}
};