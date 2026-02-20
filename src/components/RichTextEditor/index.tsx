import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './index.css';

export interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    /** 编辑区最小高度，默认 180px */
    minHeight?: number;
    readOnly?: boolean;
}

/** 工具栏配置 */
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
];

/**
 * 富文本编辑器组件
 * 基于 react-quill-new (Quill 2.0)
 * 兼容 Ant Design Form 的 value/onChange 接口
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value = '',
    onChange,
    placeholder = '请输入内容…',
    minHeight = 180,
    readOnly = false,
}) => {
    const modules = useMemo(
        () => ({
            toolbar: TOOLBAR_OPTIONS,
        }),
        [],
    );

    const formats = useMemo(
        () => [
            'header',
            'bold', 'italic', 'underline', 'strike',
            'color', 'background',
            'list',
            'blockquote', 'code-block',
            'link',
        ],
        [],
    );

    const handleChange = (content: string) => {
        // Quill 空内容时会返回 '<p><br></p>'，统一置空
        const isEmpty = content === '<p><br></p>' || content === '<p></p>';
        onChange?.(isEmpty ? '' : content);
    };

    return (
        <div className="rich-text-editor-wrap">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                readOnly={readOnly}
                style={{ '--ql-editor-min-height': `${minHeight}px` } as React.CSSProperties}
            />
        </div>
    );
};

export default RichTextEditor;
