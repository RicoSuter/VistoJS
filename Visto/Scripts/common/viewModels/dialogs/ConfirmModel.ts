import visto = require("libs/visto");

export class ConfirmModel extends visto.VistoViewModel {
	message: string;

    initialize(parameters: visto.VistoParameters) {
		this.message = parameters.getValue<string>("message");
	}
}