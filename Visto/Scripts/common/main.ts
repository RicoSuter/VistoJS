import visto = require("libs/visto");
import package = require("module");

/**
 * Shows a confirm dialog box with with various buttons.
 */
export function confirm(title: string, message: string, buttons: Buttons) {
    return Q.Promise<DialogResult>((resolve) => {
        var buttonCollection: visto.IDialogButton[] = [];
        if (buttons === Buttons.YesNoCancel || buttons === Buttons.YesNo) {
            buttonCollection.push({
                label: "Yes",
                click: dialog => {
                    dialog.close();
                    resolve(DialogResult.Yes);
                }
            });
        }

        if (buttons === Buttons.YesNoCancel || buttons === Buttons.YesNo) {
            buttonCollection.push({
                label: "No",
                click: dialog => {
                    dialog.close();
                    resolve(DialogResult.No);
                }
            });
        }

        if (buttons === Buttons.OkCancel || buttons === Buttons.Ok) {
            buttonCollection.push({
                label: "OK",
                click: dialog => {
                    dialog.close();
                    resolve(DialogResult.Ok);
                }
            });
        }

        if (buttons === Buttons.YesNoCancel || buttons === Buttons.OkCancel) {
            buttonCollection.push({
                label: "Cancel",
                click: dialog => {
                    dialog.close();
                    resolve(DialogResult.Cancel);
                }
            });
        }

        visto.showDialog(visto.getViewName(package, "dialogs/Confirm"), {
            title: title,
            message: message,
            buttons: buttonCollection
        }, view => {
            view.dialog.on('keydown', ev => {
                if (ev.keyCode === $.ui.keyCode.ESCAPE && (buttons === Buttons.OkCancel || buttons === Buttons.YesNoCancel)) {
                    view.close();
                    resolve(DialogResult.Cancel);
                }
            });
        });
    });
};

export enum DialogResult {
    Ok, 
    Cancel, 
    Yes, 
    No, 
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
        visto.showDialog(package, "dialogs/ProgressDialog", {
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
                    view.dialog.dialog("close");
                },
                update: () => {
                    if (progress.maximum === null)
                        view.getElement("#body").html("...");
                    else
                        view.getElement("#body").html(progress.value + " / " + progress.maximum);
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
 * Shows an prompt dialog box to enter a string value. 
 */
export function prompt(title: string, message: string, defaultText: string) {
    return Q.Promise<string>((resolve, reject) => {
        var output = ko.observable(defaultText);
        visto.showDialog(package, "dialogs/Prompt", {
            message: message,
            output: output,
            title: title,
            buttons: [
                {
                    label: "OK",
                    click: dialog => {
                        dialog.close();
                        resolve(output());
                    }
                },
                {
                    label: "Cancel",
                    click: dialog => {
                        dialog.close();
                        reject(null);
                    }
                }
            ]
        }, view => {
            view.dialog.on('keyup', ev => {
                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                    view.close();
                    reject(null);
                } else if (ev.keyCode === $.ui.keyCode.ENTER) {
                    view.close();
                    resolve(output());
                }
            });
        });
    });
};

/**
 * Shows a dialog with a list picker. 
 */
export function listPicker<TItem>(header: string, label: string, items: any[], selectedItem: TItem, optionsText: string) {
    return Q.Promise<TItem>((resolve, reject) => {
        var observableSelectedItem = ko.observable<TItem>(selectedItem);
        visto.showDialog(package, "dialogs/ListPicker", {
            title: header,
            label: label,
            selectedItem: selectedItem,
            items: items,
            optionsText: optionsText,
            buttons: [
                {
                    label: "OK",
                    click: dialog => {
                        dialog.close();
                        resolve(observableSelectedItem());
                    }
                },
                {
                    label: "Cancel",
                    click: dialog => {
                        dialog.close();
                        reject(null);
                    }
                }
            ]
        }, view => {
            view.dialog.on('keyup', ev => {
                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                    view.dialog.dialog("close");
                    reject(null);
                } else if (ev.keyCode === $.ui.keyCode.ENTER) {
                    view.dialog.dialog("close");
                    resolve(observableSelectedItem());
                }
            });
        });
    });
};