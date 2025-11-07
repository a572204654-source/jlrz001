const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, VerticalAlign, BorderStyle, TextDirection, TextRun } = require('docx')

/**
 * 生成监理日志Word文档（按照标准格式1:1还原）
 * @param {Object} logData - 监理日志数据
 * @returns {Promise<Buffer>} Word文档Buffer
 */
async function generateSupervisionLogWord(logData) {
  try {
    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1英寸 = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // ============== 标题 ==============
          new Paragraph({
            text: '监理日志',
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400
            },
            style: 'Heading1'
          }),

          // ============== 主表格 ==============
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
            },
            rows: [
              // 第1行：单位工程名称和编号
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单位工程名称', true)]
                  }),
                  new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph(logData.work_name || '')]
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('单位工程编号', true)]
                  }),
                  new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createLeftParagraph(logData.work_code || '')]
                  })
                ]
              }),

              // 第2行：日期
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('日期', true)]
                  }),
                  new TableCell({
                    width: { size: 82, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 3,
                    children: [createLeftParagraph(formatDate(logData.log_date))]
                  })
                ]
              }),

              // 第3行：气象
              new TableRow({
                height: { value: 600, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('气象', true)]
                  }),
                  new TableCell({
                    width: { size: 82, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    columnSpan: 3,
                    children: [createLeftParagraph(logData.weather || '')]
                  })
                ]
              }),

              // 第4行：工程动态
              new TableRow({
                height: { value: 2000, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                    children: [createCenteredParagraph('工程动态', true)]
                  }),
                  new TableCell({
                    width: { size: 94, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    columnSpan: 3,
                    children: [createContentParagraph(logData.project_dynamics || '')]
                  })
                ]
              }),

              // 第5行：监理工作情况
              new TableRow({
                height: { value: 2000, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                    children: [createCenteredParagraph('监理工作情况', true)]
                  }),
                  new TableCell({
                    width: { size: 94, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    columnSpan: 3,
                    children: [createContentParagraph(logData.supervision_work || '')]
                  })
                ]
              }),

              // 第6行：安全监理工作情况
              new TableRow({
                height: { value: 2000, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                    children: [createCenteredParagraph('安全监理工作情况', true)]
                  }),
                  new TableCell({
                    width: { size: 94, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.TOP,
                    columnSpan: 3,
                    children: [createContentParagraph(logData.safety_work || '')]
                  })
                ]
              }),

              // 第7行：签名区
              new TableRow({
                height: { value: 800, rule: 'atLeast' },
                children: [
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('记录人', true)]
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph(logData.recorder_name || '')]
                  }),
                  new TableCell({
                    width: { size: 17, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('年   月   日')]
                  }),
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('审核人', true)]
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph(logData.reviewer_name || '')]
                  }),
                  new TableCell({
                    width: { size: 17, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [createCenteredParagraph('年   月   日')]
                  })
                ]
              })
            ]
          })
        ]
      }],
      styles: {
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              size: 44,  // 22pt
              bold: true,
              font: '宋体'
            },
            paragraph: {
              spacing: {
                after: 200
              }
            }
          }
        ]
      }
    })

    // 生成Buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer

  } catch (error) {
    console.error('生成Word文档错误:', error)
    throw error
  }
}

/**
 * 创建居中对齐的段落
 * @param {string} text - 文本内容
 * @param {boolean} bold - 是否加粗
 * @returns {Paragraph}
 */
function createCenteredParagraph(text, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: text,
        size: 24,  // 12pt
        bold: bold,
        font: '宋体'
      })
    ]
  })
}

/**
 * 创建左对齐的段落
 * @param {string} text - 文本内容
 * @returns {Paragraph}
 */
function createLeftParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        size: 24,  // 12pt
        font: '宋体'
      })
    ]
  })
}

/**
 * 创建内容段落（带缩进）
 * @param {string} text - 文本内容
 * @returns {Paragraph}
 */
function createContentParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: {
      left: 400,
      right: 200
    },
    spacing: {
      line: 360,  // 1.5倍行距
      before: 100,
      after: 100
    },
    children: [
      new TextRun({
        text: text,
        size: 24,  // 12pt
        font: '宋体'
      })
    ]
  })
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}年${month}月${day}日`
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

module.exports = {
  generateSupervisionLogWord
}
