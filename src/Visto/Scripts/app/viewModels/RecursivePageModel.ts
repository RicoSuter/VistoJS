import visto = require("libs/visto");
import pkg = require("module");

export class RecursivePageModel extends visto.ViewModel {
    initialize() {
        this.enablePageRestore();
    }

    navigate() {
        visto.navigateTo(pkg, "RecursivePage");
    }
} 