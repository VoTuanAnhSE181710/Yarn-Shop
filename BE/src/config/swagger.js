import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Yarn Shop API',
            version: '1.0.0',
            description: 'API documentation for Yarn Shop System',
            contact: {
                name: 'API Support',
                email: 'support@yarnshop.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://yarn-shop-be.onrender.com/api/v1',
                description: 'Production server (Render)'
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'Authentication and authorization endpoints'
            },
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Permissions',
                description: 'Permission management endpoints'
            },
            {
                name: 'Roles',
                description: 'Role management endpoints'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token (without "Bearer" prefix)'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error'
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            example: '65be000000000000000001',
                            description: 'User ID (converted from _id)'
                        },
                        username: {
                            type: 'string',
                            example: 'johndoe'
                        },
                        email: {
                            type: 'string',
                            example: 'john@example.com'
                        },
                        fullName: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        phone: {
                            type: 'string',
                            example: '0123456789'
                        },
                        address: {
                            type: 'string',
                            example: '123 Street'
                        },
                        gender: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE'],
                            example: 'MALE'
                        },
                        dateOfBirth: {
                            type: 'string',
                            format: 'date-time',
                            example: '1990-01-15T00:00:00.000Z'
                        },
                        roleId: {
                            type: 'object',
                            description: 'Populated role object',
                            properties: {
                                _id: {
                                    type: 'string',
                                    example: '65be000000000000000002'
                                },
                                name: {
                                    type: 'string',
                                    example: 'Engineer'
                                }
                            }
                        },
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'INACTIVE', 'LOCKED'],
                            example: 'ACTIVE'
                        },
                        loginAttempts: {
                            type: 'number',
                            example: 0
                        },
                        lockUntil: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: null
                        },
                        createdBy: {
                            type: 'string',
                            nullable: true,
                            example: '65be000000000000000003'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['password'],
                    properties: {
                        username: {
                            type: 'string',
                            example: 'johndoe',
                            description: 'Username (provide either username or email)'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'admin@example.com',
                            description: 'Email (provide either username or email)'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 6,
                            example: '123456'
                        }
                    },
                    oneOf: [
                        { required: ['username', 'password'] },
                        { required: ['email', 'password'] }
                    ]
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                refreshToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                }
                            }
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password', 'fullName', 'phone', 'address', 'gender', 'dateOfBirth', 'roleId'],
                    properties: {
                        username: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 30,
                            pattern: '^[a-zA-Z0-9_.-]+$',
                            example: 'johndoe',
                            description: 'Username (allowed characters: letters, numbers, -, _, .)'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            example: 'Password123',
                            description: 'Password (minimum 8 characters)'
                        },
                        fullName: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        phone: {
                            type: 'string',
                            pattern: '^0[0-9]{9}$',
                            example: '0123456789',
                            description: 'Phone number (10 digits starting with 0)'
                        },
                        address: {
                            type: 'string',
                            example: '123 Main Street'
                        },
                        gender: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE'],
                            example: 'MALE'
                        },
                        dateOfBirth: {
                            type: 'string',
                            format: 'date',
                            example: '01/15/1990',
                            description: 'Date of birth in MM/DD/YYYY format, must be in the past'
                        },
                        roleId: {
                            type: 'string',
                            pattern: '^[0-9a-fA-F]{24}$',
                            example: '65be000000000000000002',
                            description: 'MongoDB ObjectId of Supervisor or Engineer role'
                        }
                    }
                },
                RegisterResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                },
                RefreshTokenRequest: {
                    type: 'object',
                    required: ['oldRefreshToken'],
                    properties: {
                        oldRefreshToken: {
                            type: 'string',
                            description: 'Current valid refresh token',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                RefreshTokenResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                refreshToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                }
                            }
                        }
                    }
                },
                UpdateUserDataRequest: {
                    type: 'object',
                    required: ['userData'],
                    properties: {
                        userData: {
                            type: 'object',
                            properties: {
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'newemail@example.com'
                                },
                                fullName: {
                                    type: 'string',
                                    minLength: 3,
                                    example: 'John Updated Doe'
                                },
                                address: {
                                    type: 'string',
                                    example: '456 New Street'
                                },
                                phone: {
                                    type: 'string',
                                    pattern: '^0[0-9]{9}$',
                                    example: '0987654321'
                                },
                                gender: {
                                    type: 'string',
                                    enum: ['MALE', 'FEMALE'],
                                    example: 'MALE'
                                },
                                dateOfBirth: {
                                    type: 'string',
                                    format: 'date',
                                    example: '01/15/1990',
                                    description: 'Format: MM/DD/YYYY'
                                }
                            },
                            description: 'At least one field must be provided'
                        }
                    }
                },
                UpdateUserDataResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                updatedResult: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    }
                },
                UpdateUserStatusRequest: {
                    type: 'object',
                    required: ['status', 'description'],
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'INACTIVE'],
                            example: 'INACTIVE',
                            description: 'New status for the user'
                        },
                        description: {
                            type: 'string',
                            example: 'User requested account deactivation',
                            description: 'Reason for status change'
                        }
                    }
                },
                UpdateUserStatusResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                updateResult: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    }
                },
                Permission: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '65be000000000000000001',
                            description: 'Permission ID'
                        },
                        name: {
                            type: 'string',
                            example: 'create_user',
                            description: 'Unique permission name'
                        },
                        resource: {
                            type: 'string',
                            example: 'User',
                            description: 'Resource that permission applies to'
                        },
                        action: {
                            type: 'string',
                            enum: ['create', 'read', 'update', 'delete', 'manage'],
                            example: 'create',
                            description: 'Action that can be performed'
                        },
                        description: {
                            type: 'string',
                            example: 'Allow creating new users',
                            description: 'Description of the permission'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-02-24T10:30:00.000Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-02-24T10:30:00.000Z'
                        }
                    }
                },
                CreatePermissionRequest: {
                    type: 'object',
                    required: ['name', 'resource', 'action'],
                    properties: {
                        name: {
                            type: 'string',
                            example: 'create_user',
                            description: 'Unique permission name'
                        },
                        resource: {
                            type: 'string',
                            example: 'User',
                            description: 'Resource that permission applies to (e.g., User, Project, Task)'
                        },
                        action: {
                            type: 'string',
                            enum: ['create', 'read', 'update', 'delete', 'manage'],
                            example: 'create',
                            description: 'Action that can be performed'
                        },
                        description: {
                            type: 'string',
                            example: 'Allow creating new users',
                            description: 'Description of the permission'
                        }
                    }
                },
                CreatePermissionResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                permission: {
                                    $ref: '#/components/schemas/Permission'
                                }
                            }
                        }
                    }
                },
                UpdatePermissionRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'update_user',
                            description: 'Unique permission name'
                        },
                        resource: {
                            type: 'string',
                            example: 'User',
                            description: 'Resource that permission applies to'
                        },
                        action: {
                            type: 'string',
                            enum: ['create', 'read', 'update', 'delete', 'manage'],
                            example: 'update',
                            description: 'Action that can be performed'
                        },
                        description: {
                            type: 'string',
                            example: 'Allow updating user information',
                            description: 'Description of the permission'
                        }
                    }
                },
                UpdatePermissionResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                permission: {
                                    $ref: '#/components/schemas/Permission'
                                }
                            }
                        }
                    }
                },
                GetPermissionResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                permission: {
                                    $ref: '#/components/schemas/Permission'
                                }
                            }
                        }
                    }
                },
                GetPermissionsResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'success'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                data: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Permission'
                                    }
                                },
                                total: {
                                    type: 'integer',
                                    example: 50,
                                    description: 'Total number of permissions'
                                },
                                page: {
                                    type: 'integer',
                                    example: 1,
                                    description: 'Current page number'
                                },
                                limit: {
                                    type: 'integer',
                                    example: 10,
                                    description: 'Number of items per page'
                                },
                                totalPages: {
                                    type: 'integer',
                                    example: 5,
                                    description: 'Total number of pages'
                                }
                            }
                        }
                    }
                }
            }
        },
        security: []
    },
    apis: ['./src/api/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
