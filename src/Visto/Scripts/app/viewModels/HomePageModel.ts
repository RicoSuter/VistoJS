import visto = require("libs/visto");
import common = require("common/main");
import pkg = require("module");

export class HomePageModel extends visto.ViewModel {
    initialize() {
        this.enablePageRestore();
    }

    navigateToBindings() {
        this.context.navigateTo(pkg, "BindingsPage").done();
    }

    navigateToForm() {
        this.context.navigateTo(pkg, "FormPage").done();
    }

    navigateToRecursivePage() {
        this.context.navigateTo(pkg, "RecursivePage").done();
    }

    navigateToInternationalization() {
        this.context.navigateTo(pkg, "InternationalizationPage").done();
    }

    navigateToTabPage() {
        this.context.navigateTo(pkg, "TabPage").done();
    }

	navigateToListPage() {
        this.context.navigateTo(pkg, "ListPage").done();
    }

    navigateToWebViewPage() {
        this.context.navigateTo(pkg, "WebViewPage").done();
    }

	showAlert() {
        common.alert(this.context, this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
	}

	showCustomDialog() {
        this.context.showDialog(pkg, "SampleDialog").done();
	}
};