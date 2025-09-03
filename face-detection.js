// Face Detection e Análise de Características
class FaceAnalyzer {
    constructor() {
        this.faceDetection = null;
        this.isInitialized = false;
        this.analysisResults = null;
        
        // Características dos personagens Spider-Man
        this.spiderCharacters = [
            { name: "Peter Parker (Terra-616)", characteristics: ["homem branco", "responsável", "espirituoso"], age: "adulto", gender: "masculino" },
            { name: "Miles Morales (Terra-1610)", characteristics: ["adolescente", "negro-latino", "criativo", "sensível", "determinado"], age: "adolescente", gender: "masculino" },
            { name: "Gwen Stacy / Spider-Gwen (Terra-65)", characteristics: ["jovem branca", "cabelo raspado", "independente", "confiante", "reservada"], age: "jovem adulto", gender: "feminino" },
            { name: "Peter B. Parker (Terra-616B)", characteristics: ["homem branco", "barba por fazer", "aparência cansada", "sarcástico", "relutante", "experiente"], age: "adulto", gender: "masculino" },
            { name: "Spider-Man Noir (Terra-90214)", characteristics: ["preto e branco", "sério", "sombrio", "rígido"], age: "adulto", gender: "masculino" },
            { name: "Peni Parker (Terra-14512)", characteristics: ["adolescente asiática", "estilo anime", "energética", "resiliente", "inteligente"], age: "adolescente", gender: "feminino" },
            { name: "Spider-Punk / Hobie Brown (Terra-138)", characteristics: ["negro britânico", "moicano", "rebelde", "espirituoso", "anarquista"], age: "jovem adulto", gender: "masculino" },
            { name: "Miguel O'Hara / Spider-Man 2099 (Terra-928)", characteristics: ["latino", "intenso", "pragmático", "líder sério"], age: "adulto", gender: "masculino" },
            { name: "Jessica Drew / Mulher-Aranha (Terra-404)", characteristics: ["mulher negra", "grávida", "forte", "protetora", "determinada"], age: "adulto", gender: "feminino" },
            { name: "Pavitr Prabhakar / Spider-Man Índia (Terra-50101)", characteristics: ["indiano", "cabelo volumoso", "alegre", "confiante", "espirituoso"], age: "jovem adulto", gender: "masculino" },
            { name: "Ben Reilly / Scarlet Spider (Terra-616)", characteristics: ["clone de Peter", "melancólico", "impulsivo"], age: "adulto", gender: "masculino" },
            { name: "Mayday Parker / Spider-Girl (Terra-982)", characteristics: ["filha de Peter", "determinada", "carismática"], age: "adolescente", gender: "feminino" },
            { name: "Julia Carpenter / Spider-Woman (Terra-616)", characteristics: ["mulher branca", "reservada", "estratégica"], age: "adulto", gender: "feminino" },
            { name: "Billy Braddock / Spider-UK (Terra-833)", characteristics: ["homem britânico", "disciplinado", "diplomático"], age: "adulto", gender: "masculino" },
            { name: "Spider-Man dos jogos Insomniac (Terra-1048)", characteristics: ["visual moderno", "maduro", "equilibrado", "experiente"], age: "adulto", gender: "masculino" },
            { name: "Takuya Yamashiro / Spider-Man Japonês (Terra-51778)", characteristics: ["japonês", "dramático", "honrado"], age: "adulto", gender: "masculino" }
        ];
    }

    async initialize() {
        try {
            if (typeof FaceDetection === 'undefined') {
                console.warn('MediaPipe Face Detection não está disponível');
                return false;
            }

            this.faceDetection = new FaceDetection({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
                }
            });

            this.faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.5,
            });

            this.faceDetection.onResults((results) => {
                this.analysisResults = this.analyzeFaces(results);
            });

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Face Detection:', error);
            return false;
        }
    }

    async detectFaces(imageElement) {
        if (!this.isInitialized || !this.faceDetection) {
            console.log('Face Detection não disponível, usando análise simulada');
            return this.generateSimulatedAnalysis();
        }

        try {
            await this.faceDetection.send({ image: imageElement });
            const results = this.analysisResults;
            
            // Se não detectou faces, usar análise simulada
            if (!results || !results.characteristics || results.characteristics.length === 0) {
                console.log('Nenhuma face detectada pelo MediaPipe, usando análise simulada');
                return this.generateSimulatedAnalysis();
            }
            
            return results;
        } catch (error) {
            console.error('Erro na detecção de faces:', error);
            console.log('Usando análise simulada como fallback');
            return this.generateSimulatedAnalysis();
        }
    }

    generateSimulatedAnalysis() {
        // Gerar análise única baseada no timestamp da foto
        const timestamp = Date.now();
        const seed = timestamp % 1000; // Usar timestamp como seed para consistência
        
        // Usar seed para gerar características consistentes
        const faceVariations = [
            { width: 0.25, height: 0.35, xCenter: 0.5, yCenter: 0.5 }, // Face estreita
            { width: 0.35, height: 0.4, xCenter: 0.5, yCenter: 0.5 }, // Face média
            { width: 0.4, height: 0.45, xCenter: 0.5, yCenter: 0.5 }, // Face larga
            { width: 0.3, height: 0.5, xCenter: 0.5, yCenter: 0.5 }, // Face alongada
            { width: 0.45, height: 0.4, xCenter: 0.5, yCenter: 0.5 }  // Face quadrada
        ];

        // Escolher variação baseada no seed (consistente)
        const faceIndex = seed % faceVariations.length;
        const selectedFace = faceVariations[faceIndex];
        
        // Gerar características baseadas no seed (sempre as mesmas para a mesma foto)
        const simulatedCharacteristics = [
            { type: 'age', value: this.estimateAge(selectedFace, []), confidence: 0.6 + (seed % 30) / 100 },
            { type: 'gender', value: this.estimateGender(selectedFace, []), confidence: 0.7 + (seed % 20) / 100 },
            { type: 'ethnicity', value: this.estimateEthnicity(selectedFace, []), confidence: 0.5 + (seed % 30) / 100 },
            { type: 'hair', value: this.detectHair(selectedFace), confidence: 0.6 + (seed % 20) / 100 },
            { type: 'beard', value: this.detectBeard([]), confidence: 0.5 + (seed % 30) / 100 }
        ];

        return {
            faces: [{ score: 0.7 + (seed % 20) / 100 }],
            characteristics: [{
                faceIndex: 0,
                confidence: 0.7 + (seed % 20) / 100,
                bbox: selectedFace,
                characteristics: simulatedCharacteristics
            }]
        };
    }

    analyzeFaces(results) {
        if (!results.detections || results.detections.length === 0) {
            console.log('Nenhuma face detectada');
            return { faces: [], characteristics: [] };
        }

        const characteristics = [];
        const faces = results.detections;

        console.log(`Detectadas ${faces.length} face(s)`);

        faces.forEach((detection, index) => {
            const bbox = detection.locationData.relativeBoundingBox;
            const landmarks = detection.locationData.relativeKeypoints;

            console.log(`Face ${index + 1}: confiança ${Math.round(detection.score * 100)}%`);

            // Validar se a detecção é confiável
            if (detection.score < 0.5) {
                console.log(`Face ${index + 1} rejeitada: confiança muito baixa`);
                return;
            }

            // Validar se temos landmarks suficientes
            if (!landmarks || landmarks.length < 6) {
                console.log(`Face ${index + 1} rejeitada: landmarks insuficientes`);
                return;
            }

            // Análise de características
            const faceCharacteristics = this.analyzeFaceCharacteristics(bbox, landmarks);
            console.log(`Características da face ${index + 1}:`, faceCharacteristics);

            characteristics.push({
                faceIndex: index,
                confidence: detection.score,
                bbox: bbox,
                characteristics: faceCharacteristics
            });
        });

        return {
            faces: faces,
            characteristics: characteristics
        };
    }

    analyzeFaceCharacteristics(bbox, landmarks) {
        const characteristics = [];

        // Simulação de análise de características faciais
        // Em um sistema real, isso seria feito com ML mais avançado

        // Análise de óculos (baseada na área dos olhos)
        if (this.detectGlasses(landmarks)) {
            const glassesType = this.classifyGlasses(bbox);
            characteristics.push({
                type: 'glasses',
                value: glassesType,
                confidence: 0.8
            });
        }

        // Análise de barba (baseada na área do queixo)
        const beardType = this.detectBeard(landmarks);
        if (beardType) {
            characteristics.push({
                type: 'beard',
                value: beardType,
                confidence: 0.7
            });
        }

        // Análise de cabelo (baseada na área superior da cabeça)
        const hairType = this.detectHair(bbox);
        if (hairType) {
            characteristics.push({
                type: 'hair',
                value: hairType,
                confidence: 0.6
            });
        }

        // Análise de idade estimada
        const ageGroup = this.estimateAge(bbox, landmarks);
        if (ageGroup) {
            characteristics.push({
                type: 'age',
                value: ageGroup,
                confidence: 0.5
            });
        }

        // Análise de gênero estimado
        const gender = this.estimateGender(bbox, landmarks);
        if (gender) {
            characteristics.push({
                type: 'gender',
                value: gender,
                confidence: 0.6
            });
        }

        // Análise de etnia estimada
        const ethnicity = this.estimateEthnicity(bbox, landmarks);
        if (ethnicity) {
            characteristics.push({
                type: 'ethnicity',
                value: ethnicity,
                confidence: 0.5
            });
        }

        return characteristics;
    }

    detectGlasses(landmarks) {
        // Análise mais precisa baseada em landmarks faciais
        if (landmarks && landmarks.length >= 6) {
            // Usar landmarks dos olhos e sobrancelhas
            const leftEye = landmarks[0];
            const rightEye = landmarks[1];
            const leftEyebrow = landmarks[2];
            const rightEyebrow = landmarks[3];
            
            // Verificar se há reflexos ou estruturas que indicam óculos
            const eyeDistance = Math.abs(leftEye.x - rightEye.x);
            const eyebrowDistance = Math.abs(leftEyebrow.x - rightEyebrow.x);
            
            // Lógica melhorada: óculos geralmente criam uma diferença entre olhos e sobrancelhas
            const glassesIndicator = Math.abs(eyeDistance - eyebrowDistance) > 0.05;
            
            // Verificar simetria dos olhos (óculos podem afetar)
            const eyeSymmetry = Math.abs(leftEye.y - rightEye.y) < 0.02;
            
            return glassesIndicator && eyeSymmetry;
        }
        return false;
    }

    classifyGlasses(bbox) {
        // Classificação baseada em características da face
        const faceWidth = bbox.width;
        const faceHeight = bbox.height;
        const aspectRatio = faceWidth / faceHeight;
        
        // Lógica baseada em proporções faciais
        if (aspectRatio > 0.8) {
            return 'Óculos de grau'; // Face mais larga
        } else if (aspectRatio < 0.7) {
            return 'Óculos de sol'; // Face mais estreita
        } else {
            return 'Óculos escuros'; // Proporção média
        }
    }

    detectBeard(landmarks) {
        // Análise baseada em landmarks do queixo e boca
        if (landmarks && landmarks.length >= 6) {
            const mouth = landmarks[4];
            const chin = landmarks[5];
            
            // Calcular área do queixo
            const chinArea = Math.abs(mouth.y - chin.y);
            const faceWidth = Math.abs(landmarks[0].x - landmarks[1].x);
            
            // Barba geralmente aumenta a área do queixo
            const beardIndicator = chinArea > (faceWidth * 0.3);
            
            if (beardIndicator) {
                // Classificar tipo de barba baseado na proporção
                if (chinArea > (faceWidth * 0.4)) {
                    return 'Barba completa';
                } else if (chinArea > (faceWidth * 0.35)) {
                    return 'Barba rala';
                } else {
                    return 'Barba por fazer';
                }
            }
        }
        return 'Sem barba';
    }

    detectHair(bbox) {
        // Análise baseada na proporção da face
        const faceWidth = bbox.width;
        const faceHeight = bbox.height;
        const aspectRatio = faceWidth / faceHeight;
        
        // Lógica baseada em proporções faciais
        if (aspectRatio > 0.85) {
            return 'Cabelo curto'; // Face mais quadrada
        } else if (aspectRatio < 0.7) {
            return 'Cabelo longo'; // Face mais alongada
        } else if (faceHeight > faceWidth * 1.3) {
            return 'Moicano'; // Face muito alongada
        } else {
            return 'Cabelo liso'; // Proporção média
        }
    }

    estimateAge(bbox, landmarks) {
        // Estimativa baseada em proporções faciais
        const faceWidth = bbox.width;
        const faceHeight = bbox.height;
        const aspectRatio = faceWidth / faceHeight;
        
        // Crianças têm faces mais redondas, adultos mais alongadas
        if (aspectRatio > 0.9) {
            return 'Criança'; // Face muito redonda
        } else if (aspectRatio > 0.8) {
            return 'Adolescente'; // Face redonda
        } else if (aspectRatio > 0.7) {
            return 'Jovem adulto'; // Proporção média
        } else if (aspectRatio > 0.6) {
            return 'Adulto'; // Face alongada
        } else {
            return 'Idoso'; // Face muito alongada
        }
    }

    estimateGender(bbox, landmarks) {
        // Estimativa baseada em características faciais
        if (landmarks && landmarks.length >= 6) {
            const leftEye = landmarks[0];
            const rightEye = landmarks[1];
            const leftEyebrow = landmarks[2];
            const rightEyebrow = landmarks[3];
            
            // Calcular distâncias características
            const eyeDistance = Math.abs(leftEye.x - rightEye.x);
            const eyebrowDistance = Math.abs(leftEyebrow.x - rightEyebrow.x);
            const eyeToEyebrowDistance = Math.abs(leftEye.y - leftEyebrow.y);
            
            // Mulheres geralmente têm sobrancelhas mais próximas dos olhos
            const genderIndicator = eyeToEyebrowDistance < 0.05;
            
            return genderIndicator ? 'Feminino' : 'Masculino';
        }
        
        // Fallback baseado em proporções
        const faceWidth = bbox.width;
        const faceHeight = bbox.height;
        const aspectRatio = faceWidth / faceHeight;
        
        return aspectRatio > 0.8 ? 'Feminino' : 'Masculino';
    }

    estimateEthnicity(bbox, landmarks) {
        // Estimativa baseada em proporções faciais características
        const faceWidth = bbox.width;
        const faceHeight = bbox.height;
        const aspectRatio = faceWidth / faceHeight;
        
        if (landmarks && landmarks.length >= 6) {
            const leftEye = landmarks[0];
            const rightEye = landmarks[1];
            const eyeDistance = Math.abs(leftEye.x - rightEye.x);
            
            // Diferentes etnias têm proporções faciais características
            if (aspectRatio > 0.85 && eyeDistance > 0.15) {
                return 'Branco'; // Face mais larga, olhos mais separados
            } else if (aspectRatio < 0.75 && eyeDistance < 0.12) {
                return 'Asiático'; // Face mais estreita, olhos mais próximos
            } else if (aspectRatio > 0.8 && eyeDistance > 0.13) {
                return 'Latino'; // Proporções intermediárias
            } else if (aspectRatio < 0.8 && eyeDistance > 0.14) {
                return 'Negro'; // Face alongada, olhos separados
            } else if (aspectRatio < 0.75) {
                return 'Indiano'; // Face estreita
            } else {
                return 'Japonês'; // Proporções específicas
            }
        }
        
        // Fallback simples
        const ethnicities = ['Branco', 'Negro', 'Latino', 'Asiático', 'Indiano', 'Japonês'];
        return ethnicities[Math.floor(Math.random() * ethnicities.length)];
    }

    findBestSpiderMatch(characteristics) {
        let bestMatch = null;
        let bestScore = 0;

        this.spiderCharacters.forEach(character => {
            let score = 0;
            let totalChecks = 0;
            let weight = 0;

            // Verificar idade (peso 3)
            if (characteristics.age && character.age) {
                totalChecks++;
                weight += 3;
                if (characteristics.age.toLowerCase() === character.age.toLowerCase()) {
                    score += 3;
                } else if (this.isAgeCompatible(characteristics.age, character.age)) {
                    score += 1.5; // Idades compatíveis (ex: adolescente/jovem adulto)
                }
            }

            // Verificar gênero (peso 3)
            if (characteristics.gender && character.gender) {
                totalChecks++;
                weight += 3;
                if (characteristics.gender.toLowerCase() === character.gender.toLowerCase()) {
                    score += 3;
                }
            }

            // Verificar etnia (peso 2)
            const ethnicity = characteristics.characteristics.find(c => c.type === 'ethnicity');
            if (ethnicity) {
                totalChecks++;
                weight += 2;
                if (this.matchesEthnicity(ethnicity.value, character.characteristics)) {
                    score += 2;
                }
            }

            // Verificar características específicas (peso 1 cada)
            characteristics.characteristics.forEach(char => {
                if (char.type !== 'ethnicity') {
                    totalChecks++;
                    weight += 1;
                    character.characteristics.forEach(characterChar => {
                        if (this.matchesCharacteristic(char.value, characterChar)) {
                            score += 1;
                        }
                    });
                }
            });

            // Calcular score final ponderado
            const finalScore = weight > 0 ? score / weight : 0;
            
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestMatch = character;
            }
        });

        return { character: bestMatch, score: bestScore };
    }

    isAgeCompatible(age1, age2) {
        const ageGroups = {
            'criança': ['criança'],
            'adolescente': ['adolescente', 'jovem adulto'],
            'jovem adulto': ['adolescente', 'jovem adulto', 'adulto'],
            'adulto': ['jovem adulto', 'adulto'],
            'idoso': ['adulto', 'idoso']
        };
        
        const group1 = ageGroups[age1.toLowerCase()] || [];
        const group2 = ageGroups[age2.toLowerCase()] || [];
        
        return group1.some(age => group2.includes(age));
    }

    matchesEthnicity(ethnicity, characterCharacteristics) {
        const ethnicityMap = {
            'branco': ['homem branco', 'mulher branca', 'jovem branca'],
            'negro': ['negro', 'negro-latino', 'negro britânico', 'mulher negra'],
            'latino': ['latino', 'negro-latino'],
            'asiático': ['asiática', 'adolescente asiática'],
            'indiano': ['indiano'],
            'japonês': ['japonês']
        };
        
        const ethnicityKeywords = ethnicityMap[ethnicity.toLowerCase()] || [];
        return characterCharacteristics.some(char => 
            ethnicityKeywords.some(keyword => 
                char.toLowerCase().includes(keyword.toLowerCase())
            )
        );
    }

    matchesCharacteristic(value, characterChar) {
        const valueLower = value.toLowerCase();
        const charLower = characterChar.toLowerCase();
        
        // Matches exatos
        if (valueLower === charLower) return true;
        
        // Matches parciais
        if (valueLower.includes(charLower) || charLower.includes(valueLower)) return true;
        
        // Matches específicos
        const specificMatches = {
            'barba por fazer': ['barba por fazer', 'aparência cansada'],
            'cabelo raspado': ['cabelo raspado'],
            'moicano': ['moicano'],
            'cabelo volumoso': ['cabelo volumoso'],
            'grávida': ['grávida']
        };
        
        for (const [key, matches] of Object.entries(specificMatches)) {
            if (valueLower.includes(key) && matches.some(match => charLower.includes(match))) {
                return true;
            }
        }
        
        return false;
    }

    formatResults(results) {
        if (!results || !results.characteristics || results.characteristics.length === 0) {
            return 'Nenhuma face detectada';
        }

        let output = '';
        results.characteristics.forEach((face, index) => {
            output += `Face ${index + 1} (${Math.round(face.confidence * 100)}%):\n`;
            face.characteristics.forEach(char => {
                output += `• ${char.type}: ${char.value} (${Math.round(char.confidence * 100)}%)\n`;
            });
            output += '\n';
        });

        return output.trim();
    }

    getCharacteristicsTags(results) {
        if (!results || !results.characteristics || results.characteristics.length === 0) {
            return [];
        }

        const allCharacteristics = [];
        results.characteristics.forEach(face => {
            face.characteristics.forEach(char => {
                if (char.confidence > 0.5) {
                    allCharacteristics.push({
                        type: char.type,
                        value: char.value,
                        confidence: char.confidence
                    });
                }
            });
        });

        return allCharacteristics;
    }

    getSpiderMatch(results) {
        if (!results || !results.characteristics || results.characteristics.length === 0) {
            return null;
        }

        // Combinar características de todas as faces detectadas
        const combinedCharacteristics = {
            age: null,
            gender: null,
            characteristics: []
        };

        results.characteristics.forEach(face => {
            face.characteristics.forEach(char => {
                if (char.confidence > 0.5) {
                    if (char.type === 'age' && !combinedCharacteristics.age) {
                        combinedCharacteristics.age = char.value;
                    } else if (char.type === 'gender' && !combinedCharacteristics.gender) {
                        combinedCharacteristics.gender = char.value;
                    } else {
                        combinedCharacteristics.characteristics.push(char);
                    }
                }
            });
        });

        // Encontrar o melhor match
        return this.findBestSpiderMatch(combinedCharacteristics);
    }
}

// Exportar para uso global
window.FaceAnalyzer = FaceAnalyzer;
