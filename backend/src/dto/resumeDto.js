/**
 * Resume Data Transfer Objects
 * Owner: Resume Developer
 */

class ResumeUploadDto {
  constructor(file, userId) {
    this.file = file;
    this.userId = userId;
    this.originalName = file.originalname;
    this.mimeType = file.mimetype;
    this.size = file.size;
  }

  validate() {
    if (!this.file) {
      throw new Error('File is required');
    }
    if (this.mimeType !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }
    if (this.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('File size must be less than 10MB');
    }
    return true;
  }
}

class ResumeResponseDto {
  constructor(resume) {
    this.id = resume._id;
    this.fileName = resume.fileName;
    this.originalName = resume.originalName;
    this.status = resume.status;
    this.createdAt = resume.createdAt;
    this.atsScore = resume.atsScore;
    this.parsedData = resume.parsedData;
  }
}

module.exports = {
  ResumeUploadDto,
  ResumeResponseDto
};
