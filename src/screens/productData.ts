export const shopProducts = [
  {
    category: '패션',
    brand: '알투더블유',
    name: '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)',
    price: '151,200원',
    image: 'https://image.thehyundai.com/7/6/2/34/B1/40B1342672_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '패션',
    brand: '알투더블유',
    name: '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)',
    price: '151,200원',
    image: 'https://image.thehyundai.com/1/7/2/34/B1/40B1342714_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '패션',
    brand: '알투더블유',
    name: '[더현대Hi 단독] Cale ribbed half sleeve KN (Midnight blue)',
    price: '151,200원',
    image: 'https://image.thehyundai.com/3/7/2/34/B1/40B1342730_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '뷰티',
    brand: '조 말론 런던',
    name: '[단독] 블랙베리 앤 베이 코롱 100ml (+바디 워시 30ml 증정)',
    price: '232,750원',
    image: 'https://image.thehyundai.com/4/7/0/25/A2/40A2250746_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '뷰티',
    brand: '조 말론 런던',
    name: '잉글리쉬 페어 앤 프리지아 코롱 30ml (+코롱 1.5ml 1종 +바디 사쉐 1종 증정)',
    price: '104,500원',
    image: 'https://image.thehyundai.com/5/8/0/25/A2/40A2250850_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '뷰티',
    brand: '조 말론 런던',
    name: '프랑지파니 플라워 코롱 30ml',
    price: '108,300원',
    image: 'https://image.thehyundai.com/6/4/0/32/A2/40A2320469_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '주얼리',
    brand: '이에르로르',
    name: '샴페인 풀문 (Y) 빅 보울 귀걸이 HL2E53215YBXXX',
    price: '59,500원',
    image: 'https://image.thehyundai.com/6/3/4/08/A2/60A2084362_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '주얼리',
    brand: '이에르로르',
    name: '에센스 실버(W) 모이사나이트 플라워 스테이션 팔찌 HL4B61404W9175',
    price: '119,000원',
    image: 'https://image.thehyundai.com/0/6/5/28/A2/60A2285600_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '주얼리',
    brand: '이에르로르',
    name: '[이에르로르] [Premium Plating] H링크 AB(W) 듀오 라인 파베 뱅글 HL3B63304WB',
    price: '93,500원',
    image: 'https://image.thehyundai.com/8/4/3/12/B1/60B1123482_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
] as const

export type ShopProduct = (typeof shopProducts)[number]
