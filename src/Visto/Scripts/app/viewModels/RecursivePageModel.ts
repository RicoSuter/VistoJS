import visto = require("libs/visto");
import pkg = require("module");

export class RecursivePageModel extends visto.ViewModel {
    initialize() {
        this.enablePageRestore();
    }

    navigate() {
        this.context.navigateTo(pkg, "RecursivePage").done();
    }
} 