import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  KakaoIcon,
  FacebookIcon,
  XIcon,
  TelegramIcon,
  InstagramIcon,
  LinkIcon,
  ShareIcon,
  ThreadsIcon,
  LinkedInIcon
} from './index'

describe('Icon Components', () => {
  describe('KakaoIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<KakaoIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('기본 className이 적용되는지 확인', () => {
      const { container } = render(<KakaoIcon />)
      const svg = container.querySelector('svg')
      const className = svg.getAttribute('class')
      expect(className).toContain('w-5')
      expect(className).toContain('h-5')
    })

    it('커스텀 className이 적용되는지 확인', () => {
      const { container } = render(<KakaoIcon className="w-10 h-10 custom-class" />)
      const svg = container.querySelector('svg')
      const className = svg.getAttribute('class')
      expect(className).toContain('w-10')
      expect(className).toContain('h-10')
      expect(className).toContain('custom-class')
    })
  })

  describe('FacebookIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<FacebookIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('기본 className이 적용되는지 확인', () => {
      const { container } = render(<FacebookIcon />)
      const svg = container.querySelector('svg')
      const className = svg.getAttribute('class')
      expect(className).toContain('w-5')
      expect(className).toContain('h-5')
    })
  })

  describe('XIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<XIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('SVG path가 존재하는지 확인', () => {
      const { container } = render(<XIcon />)
      const path = container.querySelector('path')
      expect(path).toBeTruthy()
    })
  })

  describe('TelegramIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<TelegramIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('viewBox가 설정되어 있는지 확인', () => {
      const { container } = render(<TelegramIcon />)
      const svg = container.querySelector('svg')
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    })
  })

  describe('InstagramIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<InstagramIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('기본 className이 적용되는지 확인', () => {
      const { container } = render(<InstagramIcon />)
      const svg = container.querySelector('svg')
      const className = svg.getAttribute('class')
      expect(className).toContain('w-5')
      expect(className).toContain('h-5')
    })
  })

  describe('LinkIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<LinkIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('stroke가 있는 SVG인지 확인 (outline 스타일)', () => {
      const { container } = render(<LinkIcon />)
      const svg = container.querySelector('svg')
      expect(svg.getAttribute('fill')).toBe('none')
      expect(svg.getAttribute('stroke')).toBe('currentColor')
    })
  })

  describe('ShareIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<ShareIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('stroke가 있는 SVG인지 확인 (outline 스타일)', () => {
      const { container } = render(<ShareIcon />)
      const svg = container.querySelector('svg')
      expect(svg.getAttribute('fill')).toBe('none')
      expect(svg.getAttribute('stroke')).toBe('currentColor')
    })
  })

  describe('ThreadsIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<ThreadsIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('viewBox가 설정되어 있는지 확인', () => {
      const { container } = render(<ThreadsIcon />)
      const svg = container.querySelector('svg')
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    })
  })

  describe('LinkedInIcon', () => {
    it('렌더링되는지 확인', () => {
      const { container } = render(<LinkedInIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('기본 className이 적용되는지 확인', () => {
      const { container } = render(<LinkedInIcon />)
      const svg = container.querySelector('svg')
      const className = svg.getAttribute('class')
      expect(className).toContain('w-5')
      expect(className).toContain('h-5')
    })

    it('커스텀 className이 적용되는지 확인', () => {
      const { container } = render(<LinkedInIcon className="w-8 h-8" />)
      const svg = container.querySelector('svg')
      const className = svg.getAttribute('class')
      expect(className).toContain('w-8')
      expect(className).toContain('h-8')
    })
  })

  describe('모든 아이콘 공통 테스트', () => {
    const icons = [
      { name: 'KakaoIcon', Component: KakaoIcon },
      { name: 'FacebookIcon', Component: FacebookIcon },
      { name: 'XIcon', Component: XIcon },
      { name: 'TelegramIcon', Component: TelegramIcon },
      { name: 'InstagramIcon', Component: InstagramIcon },
      { name: 'LinkIcon', Component: LinkIcon },
      { name: 'ShareIcon', Component: ShareIcon },
      { name: 'ThreadsIcon', Component: ThreadsIcon },
      { name: 'LinkedInIcon', Component: LinkedInIcon }
    ]

    icons.forEach(({ name, Component }) => {
      it(`${name}이 SVG를 렌더링하는지 확인`, () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg.tagName).toBe('svg')
      })
    })

    icons.forEach(({ name, Component }) => {
      it(`${name}이 올바른 viewBox를 가지는지 확인`, () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
      })
    })

    icons.forEach(({ name, Component }) => {
      it(`${name}이 className prop을 받을 수 있는지 확인`, () => {
        const { container } = render(<Component className="test-class" />)
        const svg = container.querySelector('svg')
        const className = svg.getAttribute('class')
        expect(className).toContain('test-class')
      })
    })
  })
})
