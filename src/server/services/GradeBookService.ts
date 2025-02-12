import { PrismaClient } from "@prisma/client";
import { SubjectGradeManager } from './SubjectGradeManager';
import { TermManagementService } from "./TermManagementService";
import { AssessmentService } from "./AssessmentService";
import { BatchProcessingConfig } from '../../types/grades';

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;

interface CreateClassInput {
    name: string;
    classGroupId: string;
    capacity: number;
}

// Update type annotations to use Prisma namespace types
type Subject = {
    id: string;
    [key: string]: any;
};

type ClassData = {
    classGroup: {
        program: {
            assessmentSystem: {
                id: string;
                name: string;
                type: string;
                cgpaConfig: any;
            } | null;
            termStructures: Array<{ id: string }>;
        };
        subjects: Subject[];
    };
};

interface ActivityGrade {
    activityId: string;
    studentId: string;
    grade: number;
    assessmentPeriodId: string;
}

interface SubjectTermGradeData {

    percentage: number;
    isPassing: boolean;
    gradePoints: number;
    credits: number;
}

interface CumulativeGradeData {
    gpa: number;
    totalCredits: number;
    earnedCredits: number;
    subjectGrades: Record<string, SubjectTermGradeData>;
}

export class GradeBookService {
    private subjectGradeManager: SubjectGradeManager;
    private termService: TermManagementService;
    private assessmentService: AssessmentService;

    constructor(private db: PrismaClient) {
        this.subjectGradeManager = new SubjectGradeManager(db);
        this.termService = new TermManagementService(db);
        this.assessmentService = new AssessmentService(db);
    }



    async initializeGradeBook(classId: string): Promise<void> {
        const classData = (await this.db.class.findUnique({
            where: { id: classId },
            include: {
                classGroup: {
                    include: {
                        program: {
                            include: {
                                assessmentSystem: true,
                                termStructures: {
                                    where: { status: 'ACTIVE' },
                                    orderBy: { order: 'asc' },
                                    take: 1
                                }
                            }
                        },
                        subjects: true
                    }
                }
            }
        })) as ClassData;

        if (!classData) throw new Error('Class not found');

        const assessmentSystem = classData.classGroup.program.assessmentSystem;
        const termStructure = classData.classGroup.program.termStructures[0];

        if (!assessmentSystem || !termStructure) {
            throw new Error('Assessment system or term structure not found');
        }

        await this.db.$transaction(async (tx: PrismaTransaction) => {
            const gradeBook = await tx.gradeBook.create({
                data: {
                    classId,
                    assessmentSystemId: assessmentSystem.id,
                    termStructureId: termStructure.id,
                    subjectRecords: {
                        create: classData.classGroup.subjects.map((subject: Subject) => ({
                            subjectId: subject.id,
                            termGrades: null,
                            assessmentPeriodGrades: null
                        }))
                    }
                }
            });

            await tx.class.update({
                where: { id: classId },
                data: { termStructureId: termStructure.id }
            });
        });
    }


    async createClassWithInheritance(classData: CreateClassInput): Promise<any> {
        return await this.db.$transaction(async (tx: PrismaTransaction) => {
            const newClass = await tx.class.create({
                data: {
                    name: classData.name,
                    classGroupId: classData.classGroupId,
                    status: 'ACTIVE'
                }
            });

            const classGroup = await tx.classGroup.findUnique({
                where: { id: classData.classGroupId },
                include: {
                    program: {
                        include: {
                            assessmentSystem: true,
                            termStructures: {
                                where: { status: 'ACTIVE' },
                                orderBy: { order: 'asc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            if (!classGroup?.program?.assessmentSystem || !classGroup.program.termStructures[0]) {
                throw new Error('Required program settings not found');
            }

            const gradeBook = await tx.gradeBook.create({
                data: {
                    classId: newClass.id,
                    assessmentSystemId: classGroup.program.assessmentSystem.id,
                    termStructureId: classGroup.program.termStructures[0].id,
                    subjectRecords: {
                        create: []
                    }
                }
            });

            await this.initializeSubjectGradeRecords(
                tx,
                gradeBook.id,
                classData.classGroupId
            );

            return newClass;
        });
    }

    private async initializeSubjectGradeRecords(
        tx: PrismaTransaction,
        gradeBookId: string,
        classGroupId: string
    ): Promise<void> {
        const classGroup = await tx.classGroup.findUnique({
            where: { id: classGroupId },
            include: { subjects: true }
        });

        if (!classGroup) {
            throw new Error(`ClassGroup with id ${classGroupId} not found`);
        }

        await tx.subjectGradeRecord.createMany({
            data: classGroup.subjects.map((subject: Subject) => ({
                gradeBookId,
                subjectId: subject.id,
                termGrades: null,
                assessmentPeriodGrades: null
            }))
        });
    }

    async calculateCumulativeGrade(
        gradeBookId: string,
        studentId: string,
        termId: string
    ): Promise<CumulativeGradeData> {
        const gradeBook = await this.db.gradeBook.findUnique({
            where: { id: gradeBookId },
            include: {
                assessmentSystem: true,
                subjectRecords: true,
                class: {
                    include: {
                        classGroup: {
                            include: {
                                subjects: true
                            }
                        }
                    }
                }
            }
        });

        if (!gradeBook) throw new Error('Grade book not found');

        const subjectGrades: Record<string, SubjectTermGradeData> = {};
        let totalGradePoints = 0;
        let totalCredits = 0;
        let earnedCredits = 0;

        for (const subject of gradeBook.class.classGroup.subjects) {
            const termGrade = await this.subjectGradeManager.calculateSubjectTermGrade(
                subject.id,
                termId,
                studentId,
                gradeBook.assessmentSystemId
            );
            
            subjectGrades[subject.id] = termGrade;
            totalGradePoints += termGrade.gradePoints * termGrade.credits;
            totalCredits += termGrade.credits;
            
            if (termGrade.isPassing) {
                earnedCredits += termGrade.credits;
            }
        }

        const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

        await this.recordTermResult(
            studentId,
            termId,
            gpa,
            totalCredits,
            earnedCredits
        );

        return {
            gpa,
            totalCredits,
            earnedCredits,
            subjectGrades
        };
    }

    private async resolveAndInheritAssessmentSystem(
        classGroupId: string,
        _classId: string,
        tx: PrismaTransaction
    ) {
        const classGroup = await tx.classGroup.findUnique({
            where: { id: classGroupId },
            include: {
                program: {
                    include: {
                        assessmentSystem: true
                    }
                }
            }
        });

        if (!classGroup?.program?.assessmentSystem) {
            throw new Error('Assessment system not found for class group');
        }

        const assessmentSystem = await tx.assessmentSystem.create({
            data: {
                name: `${classGroup.program.assessmentSystem.name} - Class Copy`,
                type: classGroup.program.assessmentSystem.type,
                programId: classGroup.program.id,
                cgpaConfig: classGroup.program.assessmentSystem.cgpaConfig
            }
        });

        return assessmentSystem;
    }

    private async recordTermResult(
        studentId: string,
        termId: string,
        gpa: number,
        totalCredits: number,
        earnedCredits: number
    ): Promise<void> {
        await this.db.termResult.upsert({
            where: {
                studentId_programTermId: {
                    studentId,
                    programTermId: termId
                }
            },
            update: {
                gpa,
                totalCredits,
                earnedCredits
            },
            create: {
                studentId,
                programTermId: termId,
                gpa,
                totalCredits,
                earnedCredits
            }
        });
    }

    async batchCalculateCumulativeGrades(
        gradeBookId: string,
        termId: string,
        config: BatchProcessingConfig
    ): Promise<void> {
        const students = await this.db.user.findMany({
            where: {
                studentProfile: {
                    class: {
                        gradeBook: {
                            id: gradeBookId
                        }
                    }
                }
            }
        });

        for (let i = 0; i < students.length; i += config.batchSize) {
            const batch = students.slice(i, i + config.batchSize);
            await Promise.all(
                batch.map((student: { id: string }) => 
                    this.calculateCumulativeGrade(gradeBookId, student.id, termId)
                        .catch(error => {
                            console.error(`Failed to calculate grades for student ${student.id}:`, error);
                            return null;
                        })
                )
            );

            if (i + config.batchSize < students.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

    }

    async updateActivityGrade(data: ActivityGrade): Promise<void> {
        const activity = await this.db.classActivity.findUnique({
            where: { id: data.activityId },
            include: {
                subject: true,
                class: {
                    include: {
                        gradeBook: true
                    }
                }
            }
        });

        if (!activity) {
            throw new Error('Activity not found');
        }

        await this.db.$transaction(async (tx: PrismaTransaction) => {
            // Update activity submission
            await tx.activitySubmission.upsert({
                where: {
                    activityId_studentId: {
                        activityId: data.activityId,
                        studentId: data.studentId
                    }
                },
                create: {
                    activityId: data.activityId,
                    studentId: data.studentId,
                    obtainedMarks: data.grade,
                    status: 'GRADED',
                    gradedAt: new Date(),
                    gradedBy: 'SYSTEM'
                },
                update: {
                    obtainedMarks: data.grade,
                    status: 'GRADED',
                    gradedAt: new Date()
                }
            });

            // Record grade history
            await tx.gradeHistory.create({
                data: {
                    studentId: data.studentId,
                    subjectId: activity.subjectId,
                    assessmentId: data.activityId,
                    gradeValue: data.grade,
                    modifiedBy: 'SYSTEM',
                    reason: 'Activity grade update'
                }
            });
        });
    }

    async calculateSubjectGrade(
        _classId: string, 
        subjectId: string, 
        termId: string
    ): Promise<number> {
        const assessments = await this.assessmentService.getSubjectTermAssessments(
            subjectId, 
            termId
        );
        
        if (!assessments || assessments.length === 0) {
            return 0;
        }

        let totalWeightedScore = 0;
        let totalPoints = 0;

        for (const assessment of assessments) {
            totalWeightedScore += assessment.obtainedMarks;
            totalPoints += assessment.totalPoints;
        }

        return totalPoints > 0 ? (totalWeightedScore / totalPoints) * 100 : 0;

    }
}