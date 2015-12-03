import visto = require("libs/visto");
import pkg = require("module");
import listPickerModel = require("viewModels/dialogs/ListPickerModel"); 

var tagAliasesRegistered = false; 

/**
 * Registers common control aliases so that they can be used without specifying the common package.
 */
export function registerTagAliases() {
    if (!tagAliasesRegistered) {
		visto.registerTagAlias("text-box", pkg, "TextBox");
		visto.registerTagAlias("check-box", pkg, "CheckBox");
		visto.registerTagAlias("button", pkg, "Button");
    }
}

/**
 * Shows a confirm dialog box with with various buttons.
 */
export function confirm(title: string, message: string, buttons: Buttons) {
    var buttonCollection: IDialogButton[] = [];
    if (buttons === Buttons.YesNoCancel || buttons === Buttons.YesNo) {
        buttonCollection.push({
            label: "Yes",
            click: dialog => {
                dialog.close(visto.DialogResult.Yes);
            }
        });
    }

    if (buttons === Buttons.YesNoCancel || buttons === Buttons.YesNo) {
        buttonCollection.push({
            label: "No",
            click: dialog => {
                dialog.close(visto.DialogResult.No);
            }
        });
    }

    if (buttons === Buttons.OkCancel || buttons === Buttons.Ok) {
        buttonCollection.push({
            label: "OK",
            click: dialog => {
                dialog.close(visto.DialogResult.Ok);
            }
        });
    }

    if (buttons === Buttons.YesNoCancel || buttons === Buttons.OkCancel) {
        buttonCollection.push({
            label: "Cancel",
            click: dialog => {
                dialog.close(visto.DialogResult.Cancel);
            }
        });
    }

    return visto.showDialog(visto.getViewName(pkg, "dialogs/Confirm"), {
        title: title,
        message: message,
        buttons: buttonCollection
    }).then(dialog => {
        return dialog.result;
    });
};

export interface IDialogButton {
    label: string;
    click: (dialog: visto.DialogBase) => void;
}

export enum Buttons {
    YesNoCancel,
    YesNo,
    OkCancel,
    Ok
}

/**
 * Shows a progress bar in a dialog. The dialog can be controlled using the dialog instance in the completed callback. 
 */
export function progressDialog(title: string) {
    return Q.Promise<IProgressDialog>((resolve) => {
        visto.showDialog(pkg, "dialogs/ProgressDialog", {
            title: title,
            resizable: false,
            draggable: true,
            dialogClass: "box no-close",
            modal: true,
            closeOnEscape: false
        }, view => {
            var progress: any = {
                maximum: null,
                value: 0,
                setMaximum: (maximum: number) => {
                    progress.maximum = maximum;
                    progress.update();
                },
                setValue: (value: number) => {
                    progress.value = value;
                    progress.update();
                },
                close: () => {
                    view.close();
                },
                update: () => {
                    if (progress.maximum === null)
                        view.getViewElement("body").html("...");
                    else
                        view.getViewElement("body").html(progress.value + " / " + progress.maximum);
                }
            };
            resolve(progress);
        });
    });
};

export interface IProgressDialog {
    setMaximum(maximum: number): void;
    setValue(value: number): void;
    close(): void;

    maximum: number;
    value: number;
};

/**
 * Shows an alert dialog box. 
 */
export function alert(title: string, message: string) {
    return confirm(title, message, Buttons.Ok);
};

/**
 * Shows an prompt dialog box to enter a string value. The promise value will be null if the user pressed the cancel button. 
 */
export function prompt(title: string, message: string, defaultText: string) {
    var output = ko.observable(defaultText);
    return visto.showDialog(pkg, "dialogs/Prompt", {
        message: message,
        output: output,
        title: title
    }).then((dialog) => {
        if (dialog.result === visto.DialogResult.Ok)
            return output();
        else
            return <string>null;
    });
};

/**
 * Shows a dialog with a list picker. 
 */
export function listPicker<TItem>(header: string, label: string, items: any[], selectedItem: TItem, optionsText: string) {
    return visto.showDialog(pkg, "dialogs/ListPicker", {
        title: header,
        label: label,
        items: items,
        selectedItem: selectedItem,
        optionsText: optionsText
    }).then((dialog: visto.Dialog<listPickerModel.ListPickerModel>) => {
        if (dialog.result === visto.DialogResult.Ok)
            return <TItem>dialog.viewModel.selectedItem();
        else
            return <TItem>null;
    });
};