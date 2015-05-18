import visto = require("libs/visto");
import ns = require("../../viewModels/dialogs/PromptModel");

export class Prompt extends visto.Dialog<ns.PromptModel>  { 
	language = visto.language;

	onLoaded() {		
		this.getElement("#input").keypress(e => {
			if (e.which === 13) {
				this.dialog.dialog("close");
                this.parameters.setValue("completed", this.viewModel.output());
			}
		});
	}
}