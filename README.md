# -

### Lighthouse

1. 로컬에 설치
    
    ```bash
    npm install lighthouse --save-dev
    
    npm install -E -g @lhci/cli
    ```
    
    - `@lhci/cli` : lhci 명령어 사용을 위한??? 패키지
2. 실행
    
    ```jsx
    // lighthouserc.js
    module.exports = {
      ci: {
        collect: {
          staticDistDir: "./build", // 빌드된 결과물 위치
          url: ["http://localhost:3000"], // Preview??? 
          numberOfRuns: 3, // 테스트 결과물 개수
        },
        assert: { // 성공 실패 여부??? 잘 안됨 테스트 필요
          assertions: {
            "categories:performance": ["warn", { minScore: 0.9 }],
            "categories:accessibility": ["error", { minScore: 1 }],
          },
        },
        upload: { // lighthouse 결과물 떨어질 위치
          target: "filesystem",
          outputDir: "./lhci_reports",
          reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%",
        },
      },
    };
    
    ```
    
    ```bash
    npm run build
    lhci autorun
    ```
    

### 단위테스트

> CRA로 프로젝트 생성하면 있는 App.test.js 그대로 사용!!
> 

```jsx
// src/App.test.js
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App component", () => {
  test("renders learn react link", () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });
  test("renders logo image", () => {
    render(<App />);
    const logoElement = screen.getByAltText(/logo/i);
    expect(logoElement).toBeInTheDocument();
  });
  test("has correct link attributess", () => {
    render(<App />);
    const link = screen.getByText(/learn react/i);
    expect(link).toHaveAttribute("href", "https://reactjs.org");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

```

```bash
npm run test
```

### GitHub Actions 사용

1. GitHub → 해당 프로젝트 Repository → Actions로 이동
2. `set up a workflow yourself →` 클릭
3. yml 파일 작성
    
    ```yaml
    # .github/workflows/main.yml
    name: Unit Test & Lighthouse CI
    on:
      push:
        branches: [ main ]
      pull_request:
        branches: [ main ]
    
    permissions: # 해당 actions에 권한 부여
      contents: read
      pull-requests: write
    
    jobs: 
      test: # Job 이름 (test)
        runs-on: ubuntu-latest # 실행 환경
    
        steps:
        - name: checkout code
          uses : actions/checkout@v4
    
        - name: Setup Node.js # Step 이름
          uses: actions/setup-node@v4 # 사용 라이브러리 이름
          with:  # 라이브러리 정보
            node-version: '20.x'
            registry-url: 'https://registry.npmjs.org'
            
        - name: Configure npm registry
          run: |
            echo "Configuring npm to use public registry"
            npm config set registry https://registry.npmjs.org/
    
        - name: Clear npm cache
          run: npm cache clean --force
    
        - name: Remove package-lock.json
          run: rm -f package-lock.json
    
        - name: Install dependencies
          run: npm install --registry=https://registry.npmjs.org/
          env:
            NODE_AUTH_TOKEN: ''
    
        - name: Run tests
          run: npm test
          
      lighthouse:
        runs-on: ubuntu-latest
        needs: test # job이 실행되기 전 실행되어야하는 job
        
        steps:
        - name: checkout code
          uses : actions/checkout@v4
    
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20.x'
            registry-url: 'https://registry.npmjs.org'
            
        - name: Configure npm registry
          run: |
            echo "Configuring npm to use public registry"
            npm config set registry https://registry.npmjs.org/
    
        - name: Clear npm cache
          run: npm cache clean --force
    
        - name: Remove package-lock.json
          run: rm -f package-lock.json
          
        - name: Install dependencies
          run: npm install --registry=https://registry.npmjs.org/
          env:
            NODE_AUTH_TOKEN: ''
    
        - name: Build project
          run: npm run build
    
        - name: Run Lighthouse CI
          env:
            LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          run: |
            npm install -g @lhci/cli
            lhci autorun || echo "Fail to Run Lighthouse CI!"
    
        - name: Format lighthouse score
          id: format_lighthouse_score
          uses: actions/github-script@v3
          with:
            github-token: ${{secrets.GITHUB_TOKEN}}
            script: |
              const fs = require('fs');
              const results = JSON.parse(fs.readFileSync("./lhci_reports/manifest.json"));
              let comments = "";
    
              results.forEach((result) => {
                const { summary, jsonPath } = result;
                const details = JSON.parse(fs.readFileSync(jsonPath));
                const { audits } = details;
    
                const formatResult = (res) => Math.round(res * 100);
    
                Object.keys(summary).forEach(
                  (key) => (summary[key] = formatResult(summary[key]))
                );
    
                const score = (res) => (res >= 90 ? "🟢" : res >= 50 ? "🟠" : "🔴");
    
                const comment = [
                  `| Category | Score |`,
                  `| --- | --- |`,
                  `| ${score(summary.performance)} Performance | ${summary.performance} |`,
                  // ... 나머지 카테고리들
                ].join("\n");
    
                const detail = [
                  `| Category | Score |`,
                  `| --- | --- |`,
                  `| ${score(
                    audits["first-contentful-paint"].score * 100
                  )} First Contentful Paint | ${
                    audits["first-contentful-paint"].displayValue
                  } |`,
                  // ... 나머지 상세 정보들
                ].join("\n");
                comments += comment + "\n\n" + detail + "\n\n";
              });
              core.setOutput('comments', `⚡ Lighthouse report!\n\n${comments}`)
    
        - name: comment PR
          if: github.event_name == 'pull_request'
          uses: unsplash/comment-on-pr@v1.3.0
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          with:
            msg: ${{ steps.format_lighthouse_score.outputs.comments}}
    ```
