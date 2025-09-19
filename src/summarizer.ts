import path from 'path';

export interface FunctionInfo {
    name: string;
    type: 'function' | 'class' | 'interface' | 'type' | 'variable';
    signature: string;
    description?: string;
    line: number;
    isExported: boolean;
    isAsync: boolean;
}

export interface FileSummary {
    path: string;
    language: string;
    totalLines: number;
    functions: FunctionInfo[];
    imports: string[];
    exports: string[];
}

export function summarizeCode(content: string, filePath: string): FileSummary {
    const extension = path.extname(filePath).toLowerCase();
    const language = getLanguage(extension);
    const lines = content.split('\n');
    
    const summary: FileSummary = {
        path: filePath,
        language,
        totalLines: lines.length,
        functions: [],
        imports: [],
        exports: []
    };

    // Extract imports
    summary.imports = extractImports(content, language);
    
    // Extract functions, classes, interfaces
    summary.functions = extractFunctions(content, language);
    
    // Extract exports
    summary.exports = extractExports(content, language);

    return summary;
}

function getLanguage(extension: string): string {
    const langMap: Record<string, string> = {
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.json': 'json',
        '.md': 'markdown',
        '.yaml': 'yaml',
        '.yml': 'yaml'
    };
    return langMap[extension] || 'text';
}

function extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
        // Match import statements
        const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)?\s*from\s+['"`]([^'"`]+)['"`]/g;
        const requireRegex = /(?:const|let|var)\s+(?:{[^}]+}|\w+)\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
    }
    
    return [...new Set(imports)]; // Remove duplicates
}

function extractExports(content: string, language: string): string[] {
    const exports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
        // Match export statements
        const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|interface\s+(\w+)|type\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+))/g;
        
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            const exportName = match[1] || match[2] || match[3] || match[4] || match[5] || match[6] || match[7];
            if (exportName) {
                exports.push(exportName);
            }
        }
    }
    
    return exports;
}

function extractFunctions(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');
    
    if (language === 'typescript' || language === 'javascript') {
        functions.push(...extractTSJSFunctions(content, lines));
    } else if (language === 'python') {
        functions.push(...extractPythonFunctions(content, lines));
    }
    
    return functions;
}

function extractTSJSFunctions(content: string, lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Regular function declarations
    const functionRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?/g;
    
    // Arrow functions
    const arrowRegex = /(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*(?::\s*[^=]+?)?\s*=>/g;
    
    // Class declarations
    const classRegex = /(export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?/g;
    
    // Interface declarations
    const interfaceRegex = /(export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?/g;
    
    // Type declarations
    const typeRegex = /(export\s+)?type\s+(\w+)\s*=/g;
    
    // Method declarations in classes
    const methodRegex = /(async\s+)?(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*{/g;
    
    function addFunctionMatches(regex: RegExp) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const isExported = !!match[1];
            const isAsync = !!(match[2] || match[4]);
            const name = match[3];
            
            if (name) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const description = extractJSDocDescription(content, match.index);
                
                functions.push({
                    name,
                    type: 'function',
                    signature: match[0].trim(),
                    description,
                    line: lineNumber,
                    isExported,
                    isAsync
                });
            }
        }
    }
    
    function addArrowMatches(regex: RegExp) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const isExported = !!match[1];
            const isAsync = !!match[4];
            const name = match[3];
            
            if (name) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const description = extractJSDocDescription(content, match.index);
                
                functions.push({
                    name,
                    type: 'function',
                    signature: match[0].trim(),
                    description,
                    line: lineNumber,
                    isExported,
                    isAsync
                });
            }
        }
    }
    
    function addOtherMatches(regex: RegExp, type: FunctionInfo['type']) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const isExported = !!match[1];
            const name = match[2];
            
            if (name) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const description = extractJSDocDescription(content, match.index);
                
                functions.push({
                    name,
                    type,
                    signature: match[0].trim(),
                    description,
                    line: lineNumber,
                    isExported,
                    isAsync: false
                });
            }
        }
    }
    
    addFunctionMatches(functionRegex);
    addArrowMatches(arrowRegex);
    addOtherMatches(classRegex, 'class');
    addOtherMatches(interfaceRegex, 'interface');
    addOtherMatches(typeRegex, 'type');
    
    return functions;
}

function extractPythonFunctions(content: string, lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Python function definitions
    const functionRegex = /def\s+(\w+)\s*\([^)]*\)(?:\s*->\s*[^:]+)?:/g;
    
    // Python class definitions
    const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const description = extractPythonDocstring(content, match.index);
        
        functions.push({
            name: match[1],
            type: 'function',
            signature: match[0].trim(),
            description,
            line: lineNumber,
            isExported: true, // Python functions are generally accessible
            isAsync: match[0].includes('async def')
        });
    }
    
    while ((match = classRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const description = extractPythonDocstring(content, match.index);
        
        functions.push({
            name: match[1],
            type: 'class',
            signature: match[0].trim(),
            description,
            line: lineNumber,
            isExported: true,
            isAsync: false
        });
    }
    
    return functions;
}

function extractJSDocDescription(content: string, functionIndex: number): string | undefined {
    // Look backwards from function to find JSDoc comment
    const beforeFunction = content.substring(0, functionIndex);
    const jsdocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
    
    let lastJSDoc: string | undefined;
    let match;
    
    while ((match = jsdocRegex.exec(beforeFunction)) !== null) {
        // Check if this JSDoc is close to the function (within 100 characters)
        const distance = functionIndex - (match.index + match[0].length);
        if (distance < 100) {
            lastJSDoc = match[1]
                .split('\n')
                .map(line => line.replace(/^\s*\*\s?/, '').trim())
                .filter(line => line.length > 0)
                .join(' ')
                .trim();
        }
    }
    
    return lastJSDoc;
}

function extractPythonDocstring(content: string, functionIndex: number): string | undefined {
    // Look after the function definition for docstring
    const afterFunction = content.substring(functionIndex);
    const docstringRegex = /:\s*\n\s*['"`]{3}([\s\S]*?)['"`]{3}/;
    
    const match = docstringRegex.exec(afterFunction);
    if (match) {
        return match[1].trim().split('\n')[0]; // First line of docstring
    }
    
    return undefined;
}

export function formatSummary(summary: FileSummary): string {
    let output = `### File: ${summary.path}\n`;
    output += `\`\`\`${summary.language}\n`;
    output += `// File contains ${summary.functions.length} ${summary.functions.length === 1 ? 'item' : 'items'}, ${summary.totalLines} lines\n\n`;
    
    // Add imports if any
    if (summary.imports.length > 0) {
        output += `// Imports: ${summary.imports.join(', ')}\n\n`;
    }
    
    // Add functions, classes, interfaces
    for (const func of summary.functions) {
        if (func.description) {
            output += `/**\n * ${func.description}\n */\n`;
        }
        
        let prefix = '';
        if (func.isExported) prefix += 'export ';
        if (func.isAsync) prefix += 'async ';
        
        output += `${prefix}${func.signature}\n\n`;
    }
    
    output += '```\n\n';
    return output;
}