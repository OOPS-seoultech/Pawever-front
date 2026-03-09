const dogEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/91b5545d-67e0-415d-8a8d-ce69fc3992a1';
const catEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/23559d36-d19d-49ed-a668-2fdb3ee664b0';
const fishEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/61a6df37-d7cf-4967-bfad-87e2eb526b81';
const hamsterEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/00865043-3ba9-469a-80e8-4a0a1ea6c53b';
const turtleEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/ad2d2a80-f8e2-43ca-a589-47bc489e2034';
const birdEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/c4142180-d415-4935-b6dd-143e4c7637b1';
const reptileEmojiAssetUri = 'https://www.figma.com/api/mcp/asset/5717411b-d298-4b6b-a12e-9771af029074';

export function resolvePetEmojiAssetUri(animalTypeName: string | null | undefined) {
  if (!animalTypeName) {
    return dogEmojiAssetUri;
  }

  if (animalTypeName.includes('고양이')) {
    return catEmojiAssetUri;
  }

  if (animalTypeName.includes('물고기')) {
    return fishEmojiAssetUri;
  }

  if (animalTypeName.includes('햄스터')) {
    return hamsterEmojiAssetUri;
  }

  if (animalTypeName.includes('거북이')) {
    return turtleEmojiAssetUri;
  }

  if (animalTypeName.includes('새')) {
    return birdEmojiAssetUri;
  }

  if (animalTypeName.includes('파충류')) {
    return reptileEmojiAssetUri;
  }

  return dogEmojiAssetUri;
}
