import visto = require("libs/visto");
import package = require("module");

export class MainView extends visto.ViewBase {
    onLoaded() {
        var frame = this.getViewElement("frame"); 
        visto.initializeDefaultFrame(frame, package, "HomePage");
    }
} 