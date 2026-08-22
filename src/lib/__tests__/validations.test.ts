import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  projectSchema,
  updateProjectSchema,
  parcelSchema,
  updateParcelSchema,
  bulkUpdateParcelStatusSchema,
  noteSchema,
  updateNoteSchema,
  documentSchema,
  exportSchema,
  importParcelSchema,
} from '../validations';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('Authentication Schemas', () => {
    describe('registerSchema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        };

        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject short names', () => {
        const invalidData = {
          name: 'J',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 2 characters');
        }
      });

      it('should reject invalid emails', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123',
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid email');
        }
      });

      it('should reject short passwords', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'short',
          confirmPassword: 'short',
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 8 characters');
        }
      });

      it('should reject mismatched passwords', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'different123',
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("don't match");
        }
      });
    });

    describe('loginSchema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'john@example.com',
          password: 'password123',
        };

        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid emails', () => {
        const invalidData = {
          email: 'invalid',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject empty passwords', () => {
        const invalidData = {
          email: 'john@example.com',
          password: '',
        };

        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('updateProfileSchema', () => {
      it('should validate profile updates', () => {
        const validData = {
          name: 'John Updated',
          email: 'newemail@example.com',
        };

        const result = updateProfileSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow partial updates', () => {
        const validData = { name: 'John Updated' };
        const result = updateProfileSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow empty object', () => {
        const result = updateProfileSchema.safeParse({});
        expect(result.success).toBe(true);
      });
    });

    describe('changePasswordSchema', () => {
      it('should validate password change', () => {
        const validData = {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        };

        const result = changePasswordSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject mismatched new passwords', () => {
        const invalidData = {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'different123',
        };

        const result = changePasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject short new passwords', () => {
        const invalidData = {
          currentPassword: 'oldpassword',
          newPassword: 'short',
          confirmPassword: 'short',
        };

        const result = changePasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Project Schemas', () => {
    describe('projectSchema', () => {
      it('should validate correct project data', () => {
        const validData = {
          name: 'New Project',
          description: 'Project description',
          status: 'Active',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        };

        const result = projectSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should require minimum name length', () => {
        const invalidData = {
          name: 'Ab',
        };

        const result = projectSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('should allow optional fields to be omitted', () => {
        const validData = {
          name: 'Project Name',
        };

        const result = projectSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('Active');
        }
      });

      it('should use default status', () => {
        const validData = {
          name: 'Project Name',
        };

        const result = projectSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('Active');
        }
      });
    });

    describe('updateProjectSchema', () => {
      it('should allow partial updates', () => {
        const validData = { name: 'Updated Name' };
        const result = updateProjectSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow empty updates', () => {
        const result = updateProjectSchema.safeParse({});
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Parcel Schemas', () => {
    describe('parcelSchema', () => {
      it('should validate correct parcel data', () => {
        const validData = {
          projectId: 'clx1234567890abcdefghij',
          parcelNumber: 'P-001',
          pin: '12-34-56-789',
          owner: 'John Smith',
          ownerAddress: '123 Main St',
          ownerCity: 'Springfield',
          ownerState: 'IL',
          ownerZip: '62701',
          ownerPhone: '555-1234',
          ownerEmail: 'owner@example.com',
          legalDesc: 'Lot 1, Block 2',
          county: 'Sangamon',
          sequence: 1,
          milepost: 2.5,
          acreage: 10.5,
        };

        const result = parcelSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should require valid CUID for projectId', () => {
        const invalidData = {
          projectId: 'invalid-id',
        };

        const result = parcelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should use default statuses', () => {
        const validData = {
          projectId: 'clx1234567890abcdefghij',
        };

        const result = parcelSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('NOT_STARTED');
          expect(result.data.titleStatus).toBe('NOT_STARTED');
          expect(result.data.damagesStatus).toBe('NOT_STARTED');
          expect(result.data.specialConditionsStatus).toBe('NOT_STARTED');
        }
      });

      it('should validate status enum values', () => {
        const invalidData = {
          projectId: 'clx1234567890abcdefghij',
          status: 'INVALID_STATUS',
        };

        const result = parcelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept valid status values', () => {
        const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED'];

        statuses.forEach(status => {
          const data = {
            projectId: 'clx1234567890abcdefghij',
            status,
          };
          const result = parcelSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should accept valid title status values', () => {
        const titleStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'CURATIVE', 'HOLD'];

        titleStatuses.forEach(titleStatus => {
          const data = {
            projectId: 'clx1234567890abcdefghij',
            titleStatus,
          };
          const result = parcelSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should accept empty string for email', () => {
        const validData = {
          projectId: 'clx1234567890abcdefghij',
          ownerEmail: '',
        };

        const result = parcelSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidData = {
          projectId: 'clx1234567890abcdefghij',
          ownerEmail: 'invalid-email',
        };

        const result = parcelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative sequence numbers', () => {
        const invalidData = {
          projectId: 'clx1234567890abcdefghij',
          sequence: -1,
        };

        const result = parcelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative acreage', () => {
        const invalidData = {
          projectId: 'clx1234567890abcdefghij',
          acreage: -5.5,
        };

        const result = parcelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('updateParcelSchema', () => {
      it('should allow partial updates', () => {
        const validData = {
          owner: 'Updated Owner',
          acreage: 15.5,
        };

        const result = updateParcelSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should not allow projectId updates', () => {
        const data = {
          projectId: 'clx1234567890abcdefghij',
        };

        const result = updateParcelSchema.safeParse(data);
        // projectId should be omitted from schema shape
        expect(result.success).toBe(true);
        if (result.success) {
          expect('projectId' in result.data).toBe(false);
        }
      });
    });

    describe('bulkUpdateParcelStatusSchema', () => {
      it('should validate bulk status updates', () => {
        const validData = {
          parcelIds: ['clx1234567890abcdefghij', 'clx0987654321zyxwvutsrq'],
          status: 'IN_PROGRESS',
        };

        const result = bulkUpdateParcelStatusSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should require valid CUID array', () => {
        const invalidData = {
          parcelIds: ['invalid-id'],
          status: 'IN_PROGRESS',
        };

        const result = bulkUpdateParcelStatusSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should require valid status enum', () => {
        const invalidData = {
          parcelIds: ['clx1234567890abcdefghij'],
          status: 'INVALID',
        };

        const result = bulkUpdateParcelStatusSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Note Schemas', () => {
    describe('noteSchema', () => {
      it('should validate correct note data', () => {
        const validData = {
          parcelId: 'clx1234567890abcdefghij',
          content: 'This is a note',
          category: 'GENERAL',
        };

        const result = noteSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty content', () => {
        const invalidData = {
          parcelId: 'clx1234567890abcdefghij',
          content: '',
        };

        const result = noteSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should use default category', () => {
        const validData = {
          parcelId: 'clx1234567890abcdefghij',
          content: 'Note content',
        };

        const result = noteSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.category).toBe('GENERAL');
        }
      });

      it('should validate category enum', () => {
        const categories = ['GENERAL', 'TITLE', 'ACQUISITION', 'SPECIAL_CONDITIONS', 'DAMAGES'];

        categories.forEach(category => {
          const data = {
            parcelId: 'clx1234567890abcdefghij',
            content: 'Note',
            category,
          };
          const result = noteSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('updateNoteSchema', () => {
      it('should allow partial updates', () => {
        const validData = {
          content: 'Updated content',
        };

        const result = updateNoteSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Document Schema', () => {
    describe('documentSchema', () => {
      it('should validate correct document data', () => {
        const validData = {
          parcelId: 'clx1234567890abcdefghij',
          name: 'Document.pdf',
          type: 'Contract',
          category: 'TITLE',
          url: 'https://example.com/document.pdf',
          size: 1024000,
          mimeType: 'application/pdf',
        };

        const result = documentSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid URLs', () => {
        const invalidData = {
          parcelId: 'clx1234567890abcdefghij',
          name: 'Document.pdf',
          type: 'Contract',
          url: 'not-a-url',
          size: 1024000,
          mimeType: 'application/pdf',
        };

        const result = documentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative file sizes', () => {
        const invalidData = {
          parcelId: 'clx1234567890abcdefghij',
          name: 'Document.pdf',
          type: 'Contract',
          url: 'https://example.com/document.pdf',
          size: -1,
          mimeType: 'application/pdf',
        };

        const result = documentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Export Schema', () => {
    describe('exportSchema', () => {
      it('should validate export data', () => {
        const validData = {
          projectId: 'clx1234567890abcdefghij',
          format: 'csv',
          sortBy: 'sequence',
          filterStatus: ['IN_PROGRESS', 'ACQUIRED'],
          filterCounty: ['Sangamon', 'Madison'],
        };

        const result = exportSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept pdf format', () => {
        const validData = {
          projectId: 'clx1234567890abcdefghij',
          format: 'pdf',
        };

        const result = exportSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid formats', () => {
        const invalidData = {
          projectId: 'clx1234567890abcdefghij',
          format: 'docx',
        };

        const result = exportSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate sortBy options', () => {
        const sortOptions = ['sequence', 'milepost', 'status', 'county'];

        sortOptions.forEach(sortBy => {
          const data = {
            projectId: 'clx1234567890abcdefghij',
            format: 'csv',
            sortBy,
          };
          const result = exportSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('Import Schema', () => {
    describe('importParcelSchema', () => {
      it('should validate import data', () => {
        const validData = {
          projectId: 'clx1234567890abcdefghij',
          file: {},
          format: 'kmz',
        };

        const result = importParcelSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept all valid formats', () => {
        const formats = ['kmz', 'kml', 'geojson', 'csv'];

        formats.forEach(format => {
          const data = {
            projectId: 'clx1234567890abcdefghij',
            file: {},
            format,
          };
          const result = importParcelSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid formats', () => {
        const invalidData = {
          projectId: 'clx1234567890abcdefghij',
          file: {},
          format: 'xlsx',
        };

        const result = importParcelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });
});
