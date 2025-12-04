/**
 * Triggers a file download in the browser
 * @param blob - The Blob or File object to download
 * @param filename - The name of the file to save as
 */
export const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

/**
 * Triggers a download from a URL
 * @param url - The URL to download from
 * @param filename - The name of the file to save as
 */
export const downloadFromUrl = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
