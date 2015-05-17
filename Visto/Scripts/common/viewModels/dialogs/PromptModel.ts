import visto = require("libs/visto");
import ns = require("../../views/dialogs/Prompt");

export class PromptModel extends visto.VistoViewModel { 
    message: KnockoutObservable<string>;
    output: KnockoutObservable<string>;

	initialize(parameters: visto.VistoParameters) {
		this.message = parameters.getObservable<string>("message");
		this.output = parameters.getObservable("output", "");
	}
}