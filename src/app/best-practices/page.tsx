'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Practice {
  id: string;
  question: string;
  answer: string;
  category: string;
  timestamp: string;
}

// 示例最佳实践数据
const EXAMPLE_PRACTICES: Practice[] = [
  {
    id: '1',
    question: '请问一般的塑料抽粒厂的排污许可证是归类在合成材料，还是塑料制品业行业？需要做重点管理吗？',
    answer: '您好！根据《固定污染源排污许可分类管理名录（2019年版）》，塑料抽粒厂属于塑料制品业（行业代码292）。具体管理类别需根据生产工艺确定：若涉及塑料人造革或合成革制造需重点管理；年产1万吨及以上泡沫塑料或改性塑料需简化管理；其他普通塑料制品加工（如抽粒造粒）一般实施登记管理。建议结合企业具体生产规模及工艺类型综合判定管理类别。谢谢您的关注与支持！',
    category: '排污许可',
    timestamp: '2024-02-15'
  },
  {
    id: '2',
    question: '企业从事高粱、大麦、小麦、玉米、豌豆的分选，主要是外购高粱、大麦、小麦、玉米、豌豆，利用机器将高粱、大麦、小麦、玉米、豌豆中的石子、铁屑、污物等分选出来，不进行脱壳、碾碎等加工，分选出来的产品在仓库储存。分选过程主要污染物为颗粒物、噪声和分选出来的固体废物（石子、铁屑、污物等）。请问这种项目是否属于环评豁免的类别？',
    answer: '您好！根据《建设项目环境影响评价分类管理名录》（2021年版）农副食品加工业相关规定，粮食及饲料加工项目中仅涉及分选且不进行脱壳、碾碎等物理化学改性的工序，若污染物仅为颗粒物、噪声及一般固体废物（如石子等无机杂质），可豁免环境影响报告书或报告表审批，但需履行环境影响登记表备案手续。此外，分选后的仓库储存若未涉及危化品或特殊污染物，亦符合仓储类豁免条件。综上，该项目属于环评豁免类别，但仍需依法填报环境影响登记表。建议结合属地生态环境部门具体要求办理手续。谢谢您的关注与支持！',
    category: '环境影响评价',
    timestamp: '2024-07-04'
  },
  {
    id: '3',
    question: '公司在保养模具时会用到模具除垢剂、脱模剂， 用完后的罐子是按照工业垃圾处理还是危废处理？',
    answer: '您好！根据《中华人民共和国固体废物污染环境防治法》第一百二十四条，危险废物是指列入国家危险废物名录或经鉴别认定具有危险特性的固体废物。模具除垢剂、脱模剂使用后的空罐若内壁残留物含有毒、腐蚀性等危险成分（需对照《国家危险废物名录》鉴别具体成分），则属于危险废物，应按危废管理；若经彻底清理且残留物无害，可按工业固体废物处理。建议企业委托专业机构对空罐进行危险特性鉴别或直接参照化学品安全技术说明书（MSDS）判定。谢谢您的关注与支持！',
    category: '固废处理',
    timestamp: '2025-02-13'
  }
];

export default function BestPractices() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', ...new Set(EXAMPLE_PRACTICES.map(p => p.category))];
  
  const filteredPractices = selectedCategory === 'all'
    ? EXAMPLE_PRACTICES
    : EXAMPLE_PRACTICES.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">环保法律咨询最佳实践</h1>
          <Link 
            href="/"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            返回对话
          </Link>
        </div>

        {/* 分类筛选 */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? '全部' : category}
              </button>
            ))}
          </div>
        </div>

        {/* 实践列表 */}
        <div className="space-y-6">
          {filteredPractices.map((practice) => (
            <div
              key={practice.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {practice.question}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {practice.timestamp}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {practice.answer}
              </p>
              <div className="mt-4">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                  {practice.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 