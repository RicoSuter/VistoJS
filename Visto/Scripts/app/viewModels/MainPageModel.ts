import visto = require("libs/visto");
import common = require("common/main");
import package = require("module");

export class MainPageModel extends visto.ViewModel {
    initialize() {
        this.enablePageRestore();
    }

    navigateToBindings() {
        visto.navigateTo(package, "BindingsPage");
    }

    navigateToInternationalization() {
        visto.navigateTo(package, "InternationalizationPage");
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

	showAlert() {
        common.alert(this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
	}

	showCustomDialog() {
        visto.showDialog(package, "SampleDialog");
	}
};