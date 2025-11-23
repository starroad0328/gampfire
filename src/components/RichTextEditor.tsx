'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TiptapImage from '@tiptap/extension-image'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const fontSizes = [
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '15px', value: '15px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '30px', value: '30px' },
]

const fontFamilies = [
  { label: '기본 서체', value: 'inherit' },
  { label: '고딕', value: 'sans-serif' },
  { label: '명조', value: 'serif' },
  { label: '굴림', value: 'Gulim, sans-serif' },
  { label: '돋움', value: 'Dotum, sans-serif' },
  { label: '바탕', value: 'Batang, serif' },
]

export default function RichTextEditor({ content, onChange, placeholder = '내용을 입력하세요.' }: RichTextEditorProps) {
  const [fontSize, setFontSize] = useState('15px')
  const [fontFamily, setFontFamily] = useState('inherit')
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md cursor-move',
          draggable: false, // Use custom drag with mousedown/mousemove/mouseup
        },
      }),
      HorizontalRule,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handleDOMEvents: {},
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Custom drag with mousedown/mousemove/mouseup (GPT logic + wheel scroll)
  useEffect(() => {
    if (!editor) return

    let draggingImg: HTMLImageElement | null = null
    let dropIndicator: HTMLDivElement | null = null
    let dragPreview: HTMLDivElement | null = null
    let draggingNode: any = null
    let draggingPos = -1
    let lastMouseY = 0

    const createDropIndicator = (left: number, top: number, width: number) => {
      const indicator = document.createElement('div')
      indicator.style.cssText = `
        position: fixed !important;
        left: ${left}px !important;
        top: ${top}px !important;
        width: ${width}px !important;
        height: 4px !important;
        background-color: #ff8800 !important;
        border-radius: 2px !important;
        box-shadow: 0 0 8px rgba(255, 136, 0, 0.5) !important;
        pointer-events: none !important;
        display: block !important;
        z-index: 9998 !important;
      `
      indicator.classList.add('drop-indicator')
      document.body.appendChild(indicator)
      return indicator
    }

    const removeDropIndicator = () => {
      if (dropIndicator && dropIndicator.parentNode) {
        dropIndicator.parentNode.removeChild(dropIndicator)
      }
      dropIndicator = null
    }

    const createDragPreview = (img: HTMLImageElement) => {
      const preview = document.createElement('div')
      preview.style.cssText = `
        position: fixed !important;
        width: 80px !important;
        height: 80px !important;
        background-image: url(${img.src}) !important;
        background-size: contain !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
        border: 2px solid #ff8800 !important;
        border-radius: 4px !important;
        opacity: 0.8 !important;
        pointer-events: none !important;
        z-index: 10000 !important;
      `
      document.body.appendChild(preview)
      return preview
    }

    const removeDragPreview = () => {
      if (dragPreview && dragPreview.parentNode) {
        dragPreview.parentNode.removeChild(dragPreview)
      }
      dragPreview = null
    }

    const getDragAfterElement = (container: HTMLElement, mouseY: number) => {
      const draggableElements = [
        ...Array.from(container.children)
      ].filter(child => {
        // Filter out dragging image, drop indicator, and non-element nodes
        if (child === draggingImg) return false
        if (child === dropIndicator) return false
        if (child.classList?.contains('dragging')) return false
        if (child.classList?.contains('drop-indicator')) return false
        return true
      })

      return draggableElements.reduce(
        (closest: any, child) => {
          const box = (child as HTMLElement).getBoundingClientRect()
          const offset = mouseY - (box.top + box.height / 2)

          if (offset < 0 && offset > closest.offset) {
            return { offset, element: child }
          } else {
            return closest
          }
        },
        { offset: Number.NEGATIVE_INFINITY, element: null }
      ).element
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.nodeName !== 'IMG') return

      draggingImg = target as HTMLImageElement
      draggingImg.classList.add('dragging')

      // Find the node position in the editor
      const { state } = editor
      const pos = editor.view.posAtDOM(target, 0)
      if (pos !== null && pos !== undefined) {
        const node = state.doc.nodeAt(pos)
        if (node && node.type.name === 'image') {
          draggingPos = pos
          draggingNode = node
        }
      }

      // Create drag preview thumbnail
      dragPreview = createDragPreview(draggingImg)

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      e.preventDefault()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingImg) return

      lastMouseY = e.clientY

      // Update drag preview position (to the right of mouse)
      if (dragPreview) {
        dragPreview.style.left = `${e.clientX + 15}px`
        dragPreview.style.top = `${e.clientY - 40}px`
      }

      const editorElement = editor.view.dom
      const proseMirrorContent = editorElement
      const editorRect = editorElement.getBoundingClientRect()

      // Remove old indicator first
      removeDropIndicator()

      // Check if mouse is over the dragging image itself
      const imgRect = draggingImg.getBoundingClientRect()
      if (
        e.clientY >= imgRect.top &&
        e.clientY <= imgRect.bottom &&
        e.clientX >= imgRect.left &&
        e.clientX <= imgRect.right
      ) {
        return // Don't show indicator when over dragging image
      }

      const afterElement = getDragAfterElement(proseMirrorContent as HTMLElement, e.clientY)

      // Check if dropping at original position (before or after dragging image)
      const prevSibling = draggingImg.previousElementSibling
      const nextSibling = draggingImg.nextElementSibling

      // Don't show indicator if dropping at original position
      if (afterElement === draggingImg || afterElement === nextSibling) {
        return // Same position, don't show indicator
      }

      // Calculate where to draw the line
      let lineY = editorRect.top
      if (afterElement) {
        const rect = (afterElement as HTMLElement).getBoundingClientRect()
        lineY = rect.top
      } else {
        // At end - find last child
        const children = Array.from(proseMirrorContent.children).filter(
          child => child !== draggingImg && !child.classList.contains('drop-indicator')
        ) as HTMLElement[]
        if (children.length > 0) {
          const lastChild = children[children.length - 1]
          const rect = lastChild.getBoundingClientRect()
          lineY = rect.bottom
        }
      }

      // Create new indicator at calculated position
      dropIndicator = createDropIndicator(editorRect.left, lineY, editorRect.width)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingImg) {
        return
      }

      // Calculate drop position using lastMouseY
      if (draggingNode && draggingPos !== -1) {
        try {
          const editorElement = editor.view.dom
          const proseMirrorContent = editorElement

          if (proseMirrorContent) {
            // Check if mouse is over the dragging image itself
            const imgRect = draggingImg.getBoundingClientRect()
            if (
              e.clientY >= imgRect.top &&
              e.clientY <= imgRect.bottom &&
              e.clientX >= imgRect.left &&
              e.clientX <= imgRect.right
            ) {
              // Cleanup and return without moving
              if (draggingImg) {
                draggingImg.classList.remove('dragging')
                draggingImg = null
              }
              removeDropIndicator()
              removeDragPreview()
              document.body.style.userSelect = ''
              document.body.style.cursor = ''
              draggingNode = null
              draggingPos = -1
              return
            }

            const afterElement = getDragAfterElement(proseMirrorContent as HTMLElement, lastMouseY)

            // Check if dropping at original position
            const nextSibling = draggingImg.nextElementSibling
            if (afterElement === draggingImg || afterElement === nextSibling) {
              // Cleanup and return without moving
              if (draggingImg) {
                draggingImg.classList.remove('dragging')
                draggingImg = null
              }
              removeDropIndicator()
              removeDragPreview()
              document.body.style.userSelect = ''
              document.body.style.cursor = ''
              draggingNode = null
              draggingPos = -1
              return
            }

            let newPos: number
            if (afterElement == null) {
              // Drop at end
              newPos = editor.state.doc.content.size - 1
            } else {
              // Insert before afterElement
              const pos = editor.view.posAtDOM(afterElement as Node, 0)
              newPos = pos
            }

            // Only move if position changed
            if (newPos !== draggingPos) {
              const { state, dispatch } = editor.view
              const tr = state.tr

              // Delete from old position
              tr.delete(draggingPos, draggingPos + draggingNode.nodeSize)

              // Adjust new position if needed
              const adjustedPos = newPos > draggingPos ? newPos - draggingNode.nodeSize : newPos

              // Insert at new position
              tr.insert(adjustedPos, draggingNode)

              dispatch(tr)
            }
          }
        } catch (error) {
          console.error('Error moving image:', error)
        }
      }

      // Cleanup
      if (draggingImg) {
        draggingImg.classList.remove('dragging')
        draggingImg = null
      }
      removeDropIndicator()
      removeDragPreview()
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      draggingNode = null
      draggingPos = -1
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      editorElement.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      removeDropIndicator()
      removeDragPreview()
    }
  }, [editor])

  if (!editor) {
    return null
  }

  const addImage = () => {
    imageInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      // Upload all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('이미지 업로드 실패')
        }

        const { url } = await response.json()

        // Insert at the end of the document
        const { doc } = editor.state
        const endPos = doc.content.size

        editor
          .chain()
          .insertContentAt(endPos, {
            type: 'image',
            attrs: { src: url },
          })
          .run()
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset file input
    }
  }

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run()
  }

  const handleFontSizeChange = (size: string) => {
    setFontSize(size)
    editor.chain().focus().run()
  }

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family)
    editor.chain().focus().run()
  }

  return (
    <div className="border border-border rounded-md bg-background">
      {/* Hidden file input */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          .ProseMirror img.ProseMirror-selectednode {
            outline: 3px solid hsl(var(--primary));
            outline-offset: 2px;
            cursor: grab;
          }
          .ProseMirror img {
            cursor: grab;
            user-select: none;
            transition: opacity 0.2s;
          }
          .ProseMirror img.dragging {
            opacity: 0.3;
            cursor: grabbing;
          }
          .ProseMirror img:hover {
            opacity: 0.9;
          }
          .drop-indicator {
            display: block !important;
            width: 100% !important;
            height: 4px !important;
            background-color: #ff8800 !important;
            border-radius: 2px !important;
            box-shadow: 0 0 8px rgba(255, 136, 0, 0.5) !important;
            margin: 4px 0 !important;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            color: hsl(var(--muted-foreground));
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `
      }} />

      {/* Sticky Toolbars Container */}
      <div className="sticky top-20 z-10">
        {/* Top Icon Toolbar */}
        <div className="border-b border-border bg-background px-3 py-2 rounded-t-md">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={addImage}
              disabled={uploading}
              className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={uploading ? "업로드 중..." : "사진"}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              type="button"
              onClick={addHorizontalRule}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="구분선"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Text Formatting Toolbar */}
        <div className="border-b border-border bg-background px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background hover:bg-muted transition-colors cursor-pointer"
          >
            {fontFamilies.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background hover:bg-muted transition-colors cursor-pointer"
          >
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>

          <div className="w-px h-6 bg-border" />

          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive('bold') ? 'bg-muted' : ''
            }`}
            title="굵게"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive('italic') ? 'bg-muted' : ''
            }`}
            title="기울임"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive('underline') ? 'bg-muted' : ''
            }`}
            title="밑줄"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive('strike') ? 'bg-muted' : ''
            }`}
            title="취소선"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border" />

          {/* Align Left */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''
            }`}
            title="왼쪽 정렬"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          {/* Align Center */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''
            }`}
            title="가운데 정렬"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          {/* Align Right */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 hover:bg-muted rounded-md transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''
            }`}
            title="오른쪽 정렬"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>

      {/* Editor Content */}
      <div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
