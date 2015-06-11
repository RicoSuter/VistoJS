import visto = require("libs/visto");
import package = require("module");

export class MainView extends visto.ViewBase {
    onLoading() {
        var frame = this.getViewElement("frame"); 
        return visto.initializeDefaultFrame(frame, package, "HomePage");
    }
} 