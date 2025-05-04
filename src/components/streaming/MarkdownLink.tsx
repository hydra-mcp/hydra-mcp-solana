import React from 'react'
import MarkdownImage from './MarkdownImage'
import MarkdownAudio from './MarkdownAudio'

const MarkdownLink: React.FC = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    // if (props.href?.startsWith('#')) {
    //     return <span className="link">{props.children}</span>
    // }

    // return <a {...props} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} />

    const { href, children, ...rest } = props;
    if (!href) return <span>{children}</span>;

    // Check if this is an image link by file extension
    const imageFileRegex = /\.(jpe?g|png|gif|webp|bmp|svg|avif|tiff?)(?=[?#]|$)/i;

    // Check for image service domains or paths
    const isImageService = /(\/img\/|\/image\/|\/images\/|image_inference_output|\/photos\/)/.test(href);

    // Check for query parameters that suggest an image
    const hasImageParams = /\?.*(?:img|image|photo|pic|picture|file)=/.test(href);

    if (href && (imageFileRegex.test(href) || isImageService || hasImageParams)) {
        // Extract potential alt text from children if it's just text
        const potentialAlt = typeof children === 'string' ? children : undefined;
        return <MarkdownImage src={href} alt={potentialAlt} />;
    }

    // Audio link detection remains
    const audioFileRegex = /\.(mp3|wav|ogg|m4a|flac)(?=[?#]|$)/i;
    const isAliyunAudio = href.includes('aliyuncs.com') && href.includes('audio');
    if (href && (audioFileRegex.test(href) || isAliyunAudio)) {
        return (<span className="inline-block align-middle"><MarkdownAudio src={href} label={children} /></span>);
    }

    // Regular link
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
}

export default MarkdownLink
