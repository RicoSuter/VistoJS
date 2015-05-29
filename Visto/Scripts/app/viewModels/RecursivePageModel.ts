import visto = require("libs/visto");
import package = require("module");

export class RecursivePageModel extends visto.ViewModel {
    initialize() {
        this.enablePageRestore();
    }

    navigate() {
        visto.navigateTo(package, "RecursivePage");
    }
} 