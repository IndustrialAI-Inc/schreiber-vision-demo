// @ts-nocheck
import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
import { cn } from '@/lib/utils';

// Function to filter out content between <function> tags and handle potential malformed JSON
const filterFunctionTags = (content: string): string => {
  if (!content) return '';
  
  // First pass - completely remove function tags and their content
  let filteredContent = content.replace(/<function.*?<\/function>/gs, '');
  
  // Second pass - handle any incomplete/malformed function tags
  filteredContent = filteredContent.replace(/<function.*$/gm, '');
  
  // Handle any lingering function name attributes
  filteredContent = filteredContent.replace(/name="showTable".*?}/gs, '');
  
  return filteredContent;
};

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  // Ensure pre tags are not nested inside p tags
  pre: ({ node, ...props }) => <div {...props} />,
  // Add p tag handler to prevent nesting issues
  p: ({ node, ...props }) => {
    // React markdown might try to nest pre tags inside p tags, which is invalid HTML
    // Check children for pre tags or code blocks and render as div if found
    return <div className="my-2 leading-relaxed" {...props} />;
  },
  img: ({ node, ...props }) => {
    return (
      <div className="my-4">
        <img
          className="rounded-md max-w-full object-contain max-h-[400px] border border-muted"
          loading="lazy"
          {...props}
          alt={props.alt || "Image"}
        />
        {props.alt && props.alt !== "Image" && (
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {props.alt}
          </div>
        )}
      </div>
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    // Safe check for children array before accessing elements
    const isSources = 
      children && 
      children.length > 0 && 
      typeof children[0] === 'string' && 
      children[0].trim() === 'Sources';
    
    return (
      <h2 
        className={cn(
          "text-2xl font-semibold mt-6 mb-2",
          isSources && "text-white border-b border-white/30 pb-2"
        )} 
        {...props}
      >
        {isSources ? (
          <>
            <span className="inline-block mr-2">📚</span>
            {children}
          </>
        ) : children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    // Safe check for children array before accessing elements
    const isReferenceMaterials = 
      children && 
      children.length > 0 && 
      typeof children[0] === 'string' && 
      children[0].includes('Reference materials');
    
    return (
      <h3 
        className={cn(
          "text-xl font-semibold mt-6 mb-2",
          isReferenceMaterials && "text-muted-foreground text-lg font-medium"
        )} 
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {filterFunctionTags(children)}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
