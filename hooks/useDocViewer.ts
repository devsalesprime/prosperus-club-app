// useDocViewer.ts — React context for opening doc viewer from anywhere in the app
// Usage: const { openDoc, closeDoc } = useDocViewer();
//        openDoc('faq')  |  openDoc('privacy')  |  openDoc('terms')

import React, { createContext, useContext, useState, useCallback } from 'react';

export type DocType = 'faq' | 'privacy' | 'terms';

interface DocViewerContextValue {
    /** Currently open doc type, or null if closed */
    activeDoc: DocType | null;
    /** Open a document viewer */
    openDoc: (type: DocType) => void;
    /** Close the document viewer */
    closeDoc: () => void;
}

const DocViewerContext = createContext<DocViewerContextValue>({
    activeDoc: null,
    openDoc: () => { },
    closeDoc: () => { },
});

export const useDocViewer = () => useContext(DocViewerContext);

interface Props {
    children: React.ReactNode;
}

export const DocViewerProvider: React.FC<Props> = ({ children }) => {
    const [activeDoc, setActiveDoc] = useState<DocType | null>(null);

    const openDoc = useCallback((type: DocType) => setActiveDoc(type), []);
    const closeDoc = useCallback(() => setActiveDoc(null), []);

    return React.createElement(
        DocViewerContext.Provider,
        { value: { activeDoc, openDoc, closeDoc } },
        children
    );
};
