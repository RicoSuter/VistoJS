import visto = require("libs/visto");
import pkg = require("module");

export class MainView extends visto.ViewBase {
    onLoading() {
        var frame = this.getViewElement("frame"); 
        return visto.initializeDefaultFrame(frame, pkg, "HomePage");
    }
} 