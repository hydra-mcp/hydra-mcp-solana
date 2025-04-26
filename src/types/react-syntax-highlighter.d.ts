declare module 'react-syntax-highlighter' {
    import { ReactNode, CSSProperties } from 'react';

    export interface SyntaxHighlighterProps {
        language?: string;
        style?: CSSProperties | { [key: string]: CSSProperties };
        children?: ReactNode;
        className?: string;
        PreTag?: string | React.ComponentType<any>;
        [key: string]: any;
    }

    export const Prism: React.ComponentType<SyntaxHighlighterProps>;
    export const Light: React.ComponentType<SyntaxHighlighterProps>;
    export default class SyntaxHighlighter extends React.Component<SyntaxHighlighterProps> { }
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
    export const atomDark: any;
    export const prism: any;
    export const okaidia: any;
    export const duotoneDark: any;
    export const duotoneLight: any;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs' {
    export const docco: any;
    export const github: any;
    export const monokai: any;
    export const vs: any;
    export const vs2015: any;
} 