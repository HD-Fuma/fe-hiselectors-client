export const shopProducts = [
  {
    category: '패션',
    brand: 'SYSTEM',
    name: '울 블렌드 크롭 재킷',
    price: '359,000원',
    image: 'https://image.thehyundai.com/7/6/2/34/B1/40B1342672_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '패션',
    brand: 'TIME',
    name: '버튼 포인트 니트 카디건',
    price: '325,000원',
    image: 'https://image.thehyundai.com/1/7/2/34/B1/40B1342714_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '패션',
    brand: 'MINE',
    name: '텍스처 블록 원피스',
    price: '465,000원',
    image: 'https://image.thehyundai.com/3/7/2/34/B1/40B1342730_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '뷰티',
    brand: 'TOM FORD BEAUTY',
    name: '쏠레이 블랑 오 드 퍼퓸',
    price: '295,000원',
    image: 'https://image.thehyundai.com/4/7/0/25/A2/40A2250746_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '뷰티',
    brand: 'LA MER',
    name: '크렘 드 라 메르 모이스처라이저',
    price: '525,000원',
    image: 'https://image.thehyundai.com/5/8/0/25/A2/40A2250850_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '뷰티',
    brand: 'BYREDO',
    name: '블랑쉬 오 드 퍼퓸',
    price: '280,000원',
    image: 'https://image.thehyundai.com/6/4/0/32/A2/40A2320469_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '주얼리',
    brand: 'STONEHENgE',
    name: '실버 라운드 펜던트 목걸이',
    price: '178,000원',
    image: 'https://image.thehyundai.com/6/3/4/08/A2/60A2084362_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '주얼리',
    brand: 'J.ESTINA',
    name: '로즈 골드 미니 이어링',
    price: '158,000원',
    image: 'https://image.thehyundai.com/0/6/5/28/A2/60A2285600_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
  {
    category: '주얼리',
    brand: 'DIDIER DUBOT',
    name: '미스 두 골드 팔찌',
    price: '398,000원',
    image: 'https://image.thehyundai.com/8/4/3/12/B1/60B1123482_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
  },
] as const

export type ShopProduct = (typeof shopProducts)[number]
