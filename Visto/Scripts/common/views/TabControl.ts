import visto = require("libs/visto");
import vm = require("../viewModels/TabControlModel");

export class TabControl extends visto.VistoView<vm.TabControlModel> {
    initialize() {
        this.viewModel.parentView = this.parentView;
    }
} 