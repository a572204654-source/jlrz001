/**
 * 测试Word导出功能
 */

const { generateSupervisionLogWord } = require('../utils/wordGenerator')
const fs = require('fs')
const path = require('path')

// 测试数据
const testData = {
  work_name: '示例工程项目',
  work_code: 'GC-2024-001',
  log_date: new Date('2024-11-07'),
  weather: '晴，气温15-25℃，东南风3级',
  project_dynamics: '今日进行主体结构施工，完成三层楼板浇筑，共计浇筑混凝土150立方米。施工人员50人，机械设备运行正常。进度符合计划要求。',
  supervision_work: '1. 检查钢筋绑扎质量，符合设计要求和规范要求。\n2. 旁站监理混凝土浇筑过程，振捣密实，养护措施到位。\n3. 审查施工方案，提出优化建议3条。\n4. 组织召开监理例会，协调解决施工中的问题。',
  safety_work: '1. 检查施工现场安全防护措施，临边防护符合要求。\n2. 检查特种作业人员持证上岗情况，均持有有效证件。\n3. 检查施工用电安全，配电箱防护良好。\n4. 发现安全隐患2处，已要求施工单位立即整改。',
  recorder_name: '张三',
  reviewer_name: '李四'
}

async function testWordExport() {
  try {
    console.log('开始生成Word文档...')
    
    const buffer = await generateSupervisionLogWord(testData)
    
    console.log('Word文档生成成功！')
    console.log('文档大小:', (buffer.length / 1024).toFixed(2), 'KB')
    
    // 保存到文件
    const outputPath = path.join(__dirname, '..', 'test-监理日志.docx')
    fs.writeFileSync(outputPath, buffer)
    
    console.log('文档已保存到:', outputPath)
    console.log('✓ 测试通过！')
    
  } catch (error) {
    console.error('✗ 测试失败:', error)
    process.exit(1)
  }
}

testWordExport()

