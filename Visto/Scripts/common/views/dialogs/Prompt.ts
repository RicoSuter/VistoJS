import visto = require("libs/visto");
import ns = require("../../viewModels/dialogs/PromptModel");

export class Prompt extends visto.Dialog<ns.PromptModel>  {
    language = visto.language;

    initialize() {
        this.viewModel.onOkClicked = () => { this.close(visto.DialogResult.Ok); };
        this.viewModel.onCancelClicked = () => { this.close(visto.DialogResult.Cancel); };
    }

    onLoaded() {
        var input = this.getViewElement("input");
        input.keypress(e => {
            if (e.which === 13)
                this.close(visto.DialogResult.Ok);
        });
    }

    onShown() {
        var input = this.getViewElement("input");
        input.focus();
        input.select();
    }
}