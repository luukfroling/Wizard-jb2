declare global {
    interface Window {
        __getEditorContent?: () => string;
    }
}
export {};
