import visto = require("libs/visto");
import ns = require("../../views/dialogs/Prompt");

export class PromptModel extends visto.ViewModel { 
    message: KnockoutObservable<string>;
    output: KnockoutObservable<string>;

	initialize(parameters: visto.Parameters) {
        this.message = parameters.getObservableString("message");
        this.output = parameters.getObservableString("output", "");
	}
}